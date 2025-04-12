"use client";

import {useState, useEffect} from 'react';
import {segmentText} from "@/ai/flows/segment-text";
import {identifyContextualWords, changeTense} from "@/ai/flows/identify-contextual-words";
import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Icons} from "@/components/icons";
import {cn} from "@/lib/utils";
import {Progress} from "@/components/ui/progress";
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger} from "@/components/ui/alert-dialog";
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {useToast} from "@/hooks/use-toast";

const PlaceholderShape = "______";

interface Question {
  sentence: string;
  answer: string[];
  blanks: number[];
}

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showAnswers, setShowAnswers] = useState<boolean[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [aiSupplier, setAiSupplier] = useState("google");
  const [apiKey, setApiKey] = useState("");
  const [apiEndpoint, setApiEndpoint] = useState("");
  const [open, setOpen] = useState(false);
  const [model, setModel] = useState("gemini-2.0-flash");
  const {toast} = useToast();

  const generateQuestions = async () => {
    if (!inputText) return;

    setIsLoading(true);
    setProgress(0);

    try {
      const segmentedText = await segmentText({text: inputText});
      if (!segmentedText?.sentences) return;

      const totalSentences = segmentedText.sentences.length;
      const generatedQuestions: Question[] = [];

      for (let i = 0; i < segmentedText.sentences.length; i++) {
        const sentence = segmentedText.sentences[i];
        const contextualWordsResult = await identifyContextualWords({sentence: sentence, model: model});
        if (!contextualWordsResult?.contextualWords || contextualWordsResult.contextualWords.length === 0) {
          setProgress((i + 1) / totalSentences * 100);
          continue;
        }

        // Limit to a maximum of 2 blanks per sentence
        const numBlanks = Math.min(2, contextualWordsResult.contextualWords.length);
        const blankIndices: number[] = [];
        const answers: string[] = [];
        let currentSentence = sentence;

        // Create a map of word positions in the sentence
        const wordPositions = new Map<number, string>();
        sentence.split(" ").forEach((word, index) => {
          wordPositions.set(index, word);
        });

        // Randomly select words to blank out
        for (let j = 0; j < numBlanks; j++) {
          const randomIndex = Math.floor(Math.random() * contextualWordsResult.contextualWords.length);
          const wordToBlank = contextualWordsResult.contextualWords[randomIndex];

          // Find the index of the word in the sentence
          const wordIndex = sentence.indexOf(wordToBlank);

          if (wordIndex !== -1) {
            // Find the index of the word in the sentence (word by word)
            let spaceCount = 0;
            let currentWordIndex = 0;
            for (let k = 0; k < sentence.length; k++) {
              if (sentence[k] === " ") {
                spaceCount++;
              }
              if (sentence[k] === wordToBlank[0] && sentence.substring(k, k + wordToBlank.length) === wordToBlank) {
                currentWordIndex = spaceCount;
                break;
              }
            }

            if (!blankIndices.includes(currentWordIndex)) {
              blankIndices.push(currentWordIndex);
              answers.push(wordToBlank);

              // Call changeTense to get the other form/tense of the word
              const changedTenseResult = await changeTense({
                word: wordToBlank,
                tense: "past", // You can change the tense here
                context: sentence,
                model: model
              });

              let otherFormWord = wordToBlank;
              if (changedTenseResult?.changedWord) {
                otherFormWord = changedTenseResult.changedWord;
              }

              // Construct the regex to replace the word with the placeholder
              const regex = new RegExp(`\\b${wordToBlank.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, "g");
              currentSentence = currentSentence.replace(regex, `${PlaceholderShape} (${otherFormWord})`);
            }
          }
        }

        generatedQuestions.push({
          sentence: currentSentence,
          answer: answers,
          blanks: blankIndices
        });
        setProgress((i + 1) / totalSentences * 100);
      }
      setQuestions(generatedQuestions);
      setShowAnswers(generatedQuestions.map(() => false)); // Initialize showAnswers for new questions
    } catch (error: any) {
      console.error("Error in generateQuestions:", error);
      toast({
        variant: "destructive",
        title: "Error generating questions",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  const toggleAnswerVisibility = (index: number) => {
    setShowAnswers(prevShowAnswers => {
      const newShowAnswers = [...prevShowAnswers];
      newShowAnswers[index] = !newShowAnswers[index];
      return newShowAnswers;
    });
  };

  const handleNewText = () => {
    setInputText("");
    setQuestions([]);
    setShowAnswers([]);
  };

  const handleConfigOK = () => {
    // Implement any config update logic here
    setOpen(false);
    toast({
      title: "Configuration Updated",
      description: "AI configuration has been updated successfully.",
    });
  };


  return (
    <div className="flex flex-col items-center justify-start min-h-screen py-10 bg-background">
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">
        Fill-In-Fun
      </h1>
      <Card className="w-full max-w-3xl p-4 md:p-6 space-y-4 bg-card shadow-md rounded-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold tracking-tight">Enter your text</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            The AI will identify contextual words and create fill-in-the-blank questions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter your English text here..."
            className="w-full mb-4 bg-input text-foreground"
          />
          {isLoading && <Progress value={progress} className="mb-2"/>}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleNewText} className={cn("bg-secondary text-secondary-foreground hover:bg-secondary/80")}>
              <Icons.trash className="w-4 h-4 mr-2"/>
              New Text
            </Button>
            <Button onClick={generateQuestions} disabled={isLoading} className={cn("bg-primary text-primary-foreground hover:bg-primary/80")}>
              Generate Questions
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">Modify Config</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>AI Supplier Configuration</DialogTitle>
            <DialogDescription>
              Configure the AI supplier and credentials.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="aiSupplier" className="text-right">
                AI Supplier
              </Label>
              <Select onValueChange={setAiSupplier} defaultValue={aiSupplier} id="aiSupplier" className="col-span-3">
                <SelectTrigger>
                  <SelectValue placeholder="Select AI Supplier"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google">Google AI</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {aiSupplier === "google" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="model" className="text-right">
                  Model
                </Label>
                <Select onValueChange={setModel} defaultValue={model} id="model" className="col-span-3">
                  <SelectTrigger>
                    <SelectValue placeholder="Select Model"/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                    <SelectItem value="gemini-2.0-pro">Gemini 2.0 Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {aiSupplier === "openai" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="model" className="text-right">
                  Model
                </Label>
                <Input
                  type="text"
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="col-span-3"
                />
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="apiEndpoint" className="text-right">
                API Endpoint
              </Label>
              <Input
                type="text"
                id="apiEndpoint"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="apiKey" className="text-right">
                API Key
              </Label>
              <Input
                type="text"
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button">OK</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will update the AI configuration. Are you sure you want to
                    continue?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfigOK}>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="w-full max-w-3xl mt-8 space-y-6">
        {questions.map((question, index) => (
          <Card key={index} className="bg-card shadow-md rounded-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold tracking-tight">Question #{index + 1}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground">
                {question.sentence}
              </p>
              {question.answer.length > 0 && showAnswers[index] && (
                <div className="mt-2">
                  <p className="text-sm text-green-500">
                    Answer: {question.answer.join(", ")}
                  </p>
                </div>
              )}
              <div className="flex justify-end mt-4">
                <Button
                  variant="secondary"
                  onClick={() => toggleAnswerVisibility(index)}
                  className={cn("bg-accent text-accent-foreground hover:bg-accent/80")}
                >
                  {showAnswers[index] ? "Hide Answer" : "Show Answer"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


