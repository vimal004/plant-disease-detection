"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2,
  Send,
  AlertCircle,
  FileText,
  Calendar,
  Clock,
} from "lucide-react";
import Image from "next/image";

interface DiagnosisEntry {
  id: string;
  timestamp: string;
  image: string;
  disease: string;
  confidence: number;
  description: string;
  treatment: string;
  chat?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

export default function DiagnosisPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [history, setHistory] = useState<DiagnosisEntry[]>([]);
  const [selectedDiagnosis, setSelectedDiagnosis] =
    useState<DiagnosisEntry | null>(null);
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.push("/login");
      return;
    }

    // Load diagnosis history
    const storedHistory = JSON.parse(
      localStorage.getItem("diagnosisHistory") || "[]"
    );

    // Initialize chat array if not present
    const historyWithChat = storedHistory.map((entry: DiagnosisEntry) => ({
      ...entry,
      chat: entry.chat || [],
    }));

    setHistory(historyWithChat);

    // Select the most recent diagnosis if available
    if (historyWithChat.length > 0) {
      setSelectedDiagnosis(historyWithChat[historyWithChat.length - 1]);
    }
  }, [router]);

  const handleSelectDiagnosis = (diagnosis: DiagnosisEntry) => {
    setSelectedDiagnosis(diagnosis);
    setQuestion("");
    setError(null);
  };

  const handleSendQuestion = async () => {
    if (!question.trim() || !selectedDiagnosis) return;

    setIsLoading(true);
    setError(null);

    try {
      // Add user question to chat
      const updatedDiagnosis = {
        ...selectedDiagnosis,
        chat: [
          ...(selectedDiagnosis.chat || []),
          { role: "user", content: question },
        ],
      };

      setSelectedDiagnosis(updatedDiagnosis);

      // Format the prompt for the Gemini API
      const prompt = `Disease: ${selectedDiagnosis.disease}, Query: ${question}`;

      // Actual API call to your backend (Gemini)
      const response = await fetch(
        "https://gemini-backend-uiuz.onrender.com/gemini", // Make sure this URL is correct
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }), // Send the prompt as JSON
        }
      );
      console.log("Response from API:", response);  

      if (!response.ok) {
        throw new Error("API call failed");
      }

      const data = await response.json();
      console.log("Response data parsed:", data); // Log the response data
      const assistantReply = data.response || "Sorry, no response received.";

      // Add assistant response to chat
      const finalDiagnosis = {
        ...updatedDiagnosis,
        chat: [
          ...updatedDiagnosis.chat,
          { role: "assistant", content: assistantReply },
        ],
      };

      setSelectedDiagnosis(finalDiagnosis);

      const updatedHistory = history.map((entry) =>
        entry.id === selectedDiagnosis.id ? finalDiagnosis : entry
      );

      setHistory(updatedHistory);
      localStorage.setItem("diagnosisHistory", JSON.stringify(updatedHistory));
      setQuestion("");
    } catch (err) {
      console.error(err);
      setError("Failed to get a response. Please try again.");
      toast({
        title: "Error",
        description: "Failed to process your question",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-green-800">Plant Diagnosis</h1>

      {history.length === 0 ? (
        <Card className="border-green-200 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <FileText className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-green-800 mb-2">
              No diagnosis history
            </h3>
            <p className="text-gray-600 text-center mb-4">
              You haven't uploaded any plant images for diagnosis yet
            </p>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => router.push("/dashboard/upload")}
            >
              Upload Plant Image
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card className="border-green-200 shadow-sm h-full">
              <CardHeader>
                <CardTitle className="text-lg text-green-800">
                  Diagnosis History
                </CardTitle>
                <CardDescription>
                  Select a diagnosis to view details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedDiagnosis?.id === entry.id
                        ? "bg-green-100 border border-green-200"
                        : "hover:bg-gray-50 border border-gray-100"
                    }`}
                    onClick={() => handleSelectDiagnosis(entry)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 relative rounded overflow-hidden border border-gray-200">
                        <Image
                          src={entry.image || "/placeholder.svg"}
                          alt={entry.disease}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-green-800 truncate">
                          {entry.disease}
                        </h4>
                        <div className="flex items-center text-xs text-gray-500 space-x-2">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(entry.timestamp)}</span>
                          <Clock className="h-3 w-3 ml-1" />
                          <span>{formatTime(entry.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {selectedDiagnosis ? (
              <Card className="border-green-200 shadow-sm h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl text-green-800">
                    {selectedDiagnosis.disease}
                  </CardTitle>
                  <CardDescription>
                    Confidence:{" "}
                    {(selectedDiagnosis.confidence * 100).toFixed(1)}%
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 flex-1 overflow-y-auto">
                  <div className="aspect-video relative rounded-lg overflow-hidden border border-gray-200 mb-4">
                    <Image
                      src={selectedDiagnosis.image || "/placeholder.svg"}
                      alt={selectedDiagnosis.disease}
                      fill
                      className="object-contain"
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium text-green-800">
                        Description
                      </h3>
                      <p className="text-gray-600">
                        {selectedDiagnosis.description}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-green-800">
                        Treatment
                      </h3>
                      <p className="text-gray-600">
                        {selectedDiagnosis.treatment}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-green-800">
                        Ask About This Disease
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Ask questions about treatment, prevention, or causes
                      </p>

                      {/* Chat history */}
                      {selectedDiagnosis.chat &&
                        selectedDiagnosis.chat.length > 0 && (
                          <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto p-2">
                            {selectedDiagnosis.chat.map((message, index) => (
                              <div
                                key={index}
                                className={`p-3 rounded-lg ${
                                  message.role === "user"
                                    ? "bg-green-100 ml-8"
                                    : "bg-gray-100 mr-8"
                                }`}
                              >
                                <p className="text-sm whitespace-pre-line">
                                  {message.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                      {error && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-md flex items-center space-x-2 mb-4">
                          <AlertCircle className="h-5 w-5" />
                          <span>{error}</span>
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <Textarea
                          placeholder="Ask a question about this disease..."
                          value={question}
                          onChange={(e) => setQuestion(e.target.value)}
                          className="flex-1 resize-none"
                          disabled={isLoading}
                        />
                        <Button
                          className="bg-green-600 hover:bg-green-700"
                          onClick={handleSendQuestion}
                          disabled={!question.trim() || isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-green-200 shadow-sm h-full">
                <CardContent className="flex flex-col items-center justify-center p-8">
                  <FileText className="h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-medium text-green-800 mb-2">
                    Select a diagnosis
                  </h3>
                  <p className="text-gray-600 text-center">
                    Select a diagnosis from the history to view details and ask
                    questions
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
