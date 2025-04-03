'use client';

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Send, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface Conversation {
  id: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface Provider {
  id: string;
  provider_id: string;
  company_name: string;
  service_type: string;
  fees: string;
  location: string;
  contact_email: string;
  contact_phone: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export function MessagingPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get the current user's ID (replace with your auth method)
    const currentUserId = 'user123'; // Replace with actual user ID
    setUserId(currentUserId);
    
    if (currentUserId) {
      fetchConversations();
      fetchProviders();
    }
  }, [userId]);

  useEffect(() => {
    if (selectedConversation && userId) {
      fetchMessages();
    }
  }, [selectedConversation, userId]);

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/providers');
      if (!response.ok) throw new Error('Failed to fetch providers');
      const data = await response.json();
      setProviders(data);
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast.error('Failed to load providers');
    }
  };

  const fetchConversations = async () => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/messages?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch conversations');
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    }
  };

  const fetchMessages = async () => {
    if (!selectedConversation || !userId) return;

    try {
      const response = await fetch(
        `/api/messages?userId=${userId}&conversationId=${selectedConversation.id}`
      );
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const startNewConversation = async (provider: Provider) => {
    if (!userId) {
      toast.error('Please sign in to start a conversation');
      return;
    }

    // Check if conversation already exists
    const existingConversation = conversations.find(conv => conv.id === provider.provider_id);
    if (existingConversation) {
      setSelectedConversation(existingConversation);
      setIsNewMessageOpen(false);
      return;
    }

    // Create a new conversation
    const newConversation: Conversation = {
      id: provider.provider_id,
      lastMessage: '',
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0
    };

    setConversations(prev => [newConversation, ...prev]);
    setSelectedConversation(newConversation);
    setIsNewMessageOpen(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !userId) return;

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender_id: userId,
          receiver_id: selectedConversation.id,
          content: newMessage.trim()
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');
      
      const newMessage = await response.json();
      setMessages(prev => [...prev, newMessage]);
      setNewMessage('');
      toast.success('Message sent');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">Messages</h2>
        <Card className="p-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading messages...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Messages</h2>
        <Dialog open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Message
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Select a Provider</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[400px] pr-4">
              <div className="grid gap-4">
                {providers.map((provider) => (
                  <div
                    key={provider.id}
                    className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted cursor-pointer"
                    onClick={() => startNewConversation(provider)}
                  >
                    <Avatar>
                      <AvatarFallback>{provider.company_name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-medium">{provider.company_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {provider.service_type} • {provider.location}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {provider.fees}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <ScrollArea className="h-[500px]">
            {conversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No conversations yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Click "New Message" to start chatting with a provider
                </p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted ${
                    selectedConversation?.id === conversation.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <Avatar>
                    <AvatarFallback>
                      {providers.find(p => p.provider_id === conversation.id)?.company_name[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {providers.find(p => p.provider_id === conversation.id)?.company_name || 'Unknown Provider'}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.lastMessage}
                    </p>
                  </div>
                  {conversation.unreadCount > 0 && (
                    <div className="bg-primary text-primary-foreground rounded-full px-2 py-1 text-xs">
                      {conversation.unreadCount}
                    </div>
                  )}
                </div>
              ))
            )}
          </ScrollArea>
        </Card>
        <Card className="p-6 md:col-span-2">
          {selectedConversation ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b">
                <Avatar>
                  <AvatarFallback>
                    {providers.find(p => p.provider_id === selectedConversation.id)?.company_name[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">
                    {providers.find(p => p.provider_id === selectedConversation.id)?.company_name || 'Unknown Provider'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedConversation.lastMessageTime).toLocaleString()}
                  </p>
                </div>
              </div>
              <ScrollArea className="h-[400px] pr-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 mb-4 ${
                      message.sender_id === selectedConversation.id ? '' : 'flex-row-reverse'
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {message.sender_id === userId ? 'U' : 'P'}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`rounded-lg p-3 max-w-[70%] ${
                        message.sender_id === selectedConversation.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <span className="text-xs opacity-70 mt-1 block">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </ScrollArea>
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1"
                />
                <Button type="submit" size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Select a conversation to start messaging</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}