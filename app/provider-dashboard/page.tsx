"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Change from react-router to next/navigation
import { Bell, Calendar, CreditCard, Home, Image, LogOut, MessageSquare, Settings, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { X, Upload, CheckCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Toaster } from "sonner";
import { providerSupabase } from "@/lib/supabase2"; // Add this import
import { toast } from "sonner";
import  EventOverview  from "@/components/panels/provider/overview/page";
import { Portfolio } from "@/components/panels/provider/portfolio/page";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ScrollArea,
} from "@/components/ui/scroll-area"
import {
  Send,
} from "lucide-react"

export default function Dashboard() { // Change to default export
  const [activeTab, setActiveTab] = useState("overview");
  const router = useRouter(); // Change from navigate to router
  const [providerProfile, setProviderProfile] = useState({
    email: '',
    company_name: '',
    avatar_url: ''
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await providerSupabase.auth.getSession();
        
        if (error || !session) {
          router.push('/auth/provider-signin'); // Change to router.push and correct route name
          return;
        }

        // Set provider profile if session exists
        if (session.user) {
          setProviderProfile({
            email: session.user.email || '',
            company_name: session.user.user_metadata?.company_name || '',
            avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${session.user.email}`
          });
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/auth/provider-signin');
      }
    };

    checkAuth();

    // Set up auth state listener
    const { data: { subscription } } = providerSupabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/auth/provider-signin'); // Change to router.push
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]); // Change dependency

  // Handle logout
  const handleLogout = async () => {

    try {
      const { error } = await providerSupabase.auth.signOut();
      if (error) throw error;
      
      localStorage.removeItem('supabase.provider.token');
      router.push('/auth/provider-signin');
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-background font-aeonik">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-card border-r">
        <div className="flex h-14 items-center border-b px-4">
          <h2 className="text-lg font-semibold font-aeonik-medium">PlanSmart</h2>
        </div>
        <div className="flex flex-col p-4 space-y-2">
          <Button
            variant={activeTab === "overview" ? "default" : "ghost"}
            className="justify-start font-aeonik"
            onClick={() => setActiveTab("overview")}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Event Overview
          </Button>
          <Button
            variant={activeTab === "portfolio" ? "default" : "ghost"}
            className="justify-start"
            onClick={() => setActiveTab("portfolio")}
          >
            <Image className="mr-2 h-4 w-4" />
            Portfolio
          </Button>
          <Button
            variant={activeTab === "messages" ? "default" : "ghost"}
            className="justify-start"
            onClick={() => setActiveTab("messages")}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Messages
            <Badge className="ml-auto bg-primary text-primary-foreground">3</Badge>
          </Button>
          <Button
            variant={activeTab === "payment" ? "default" : "ghost"}
            className="justify-start"
            onClick={() => setActiveTab("payment")}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Payment
          </Button>
          <Button
            variant={activeTab === "profile" ? "default" : "ghost"}
            className="justify-start"
            onClick={() => setActiveTab("profile")}
          >
            <Settings className="mr-2 h-4 w-4" />
            Profile & Settings
          </Button>
          <Separator className="my-2" />
          <Button variant="ghost" className="justify-start text-muted-foreground"
          onClick={()=>handleLogout()}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        {/* Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-6">
          <div className="w-full flex-1">
            <h1 className="text-lg font-semibold font-aeonik-medium">
              {activeTab === "overview" && "Event Overview"}
              {activeTab === "portfolio" && "Portfolio"}
              {activeTab === "messages" && "Messages & Notifications"}
              {activeTab === "payment" && "Payment"}
              {activeTab === "profile" && "Profile & Settings"}
            </h1>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  3
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>New booking request</DropdownMenuItem>
              <DropdownMenuItem>Payment received</DropdownMenuItem>
              <DropdownMenuItem>Client message</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="rounded-full">
                <Avatar>
                  <AvatarImage src={providerProfile.avatar_url} alt={providerProfile.company_name} />
                  <AvatarFallback>{providerProfile.company_name?.charAt(0) || 'P'}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{providerProfile.company_name || 'My Account'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setActiveTab("profile")}>Profile</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab("profile")}>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-6">
            {activeTab === "overview" && <EventOverview />} {/* This line is already using the imported EventOverview component */}
            {activeTab === "portfolio" && <Portfolio />}
            {activeTab === "messages" && <Messages />}
            {activeTab === "payment" && <Payment />}
            {activeTab === "profile" && <ProfileSettings />}
          </div>
        </div>
      </main>
    </div>
  )
}

// Update EventOverview component to include proper state and error handling

function Messages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [providerId, setProviderId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProviderId = async () => {
      try {
        const { data: { session } } = await providerSupabase.auth.getSession();
        if (session?.user) {
          setProviderId(session.user.id);
          fetchConversations();
        }
      } catch (error) {
        console.error('Error fetching provider ID:', error);
      }
    };

    fetchProviderId();
  }, []);

  useEffect(() => {
    if (selectedConversation && providerId) {
      fetchMessages();
    }
  }, [selectedConversation, providerId]);

  const fetchConversations = async () => {
    if (!providerId) return;

    try {
      const response = await fetch(`/api/messages?userId=${providerId}&userType=provider`);
      if (!response.ok) throw new Error('Failed to fetch conversations');
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    }
  };

  const fetchMessages = async () => {
    if (!selectedConversation || !providerId) return;

    try {
      const response = await fetch(
        `/api/messages?userId=${providerId}&conversationId=${selectedConversation.id}&userType=provider`
      );
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !providerId) return;

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender_id: providerId,
          receiver_id: selectedConversation.id,
          content: newMessage.trim(),
          sender_type: 'provider'
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
      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight font-aeonik-medium">Messages & Notifications</h2>
      </div>

      <Tabs defaultValue="messages">
        <TabsList>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        <TabsContent value="messages" className="space-y-4 pt-4">
          {conversations.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No conversations yet</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            conversations.map((conversation) => (
              <Card key={conversation.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <div>
                      <CardTitle>User {conversation.id}</CardTitle>
                      <CardDescription>
                        {new Date(conversation.lastMessageTime).toLocaleString()}
                      </CardDescription>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <Badge>New</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p>{conversation.lastMessage}</p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    View Conversation
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </TabsContent>
        <TabsContent value="notifications" className="space-y-4 pt-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center">
              <div className="mr-2 bg-primary/10 p-2 rounded-full">
                <Bell className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">New booking request</CardTitle>
                <CardDescription>Lisa Thompson • Birthday Party</CardDescription>
              </div>
              <Badge className="ml-auto">New</Badge>
            </CardHeader>
            <CardContent>
              <p>You have a new booking request for a birthday party on May 22, 2025.</p>
            </CardContent>
            <CardFooter className="pt-0 flex gap-2">
              <Button variant="outline" className="w-full">
                Decline
              </Button>
              <Button className="w-full">Accept</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex flex-row items-center">
              <div className="mr-2 bg-primary/10 p-2 rounded-full">
                <CreditCard className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Payment received</CardTitle>
                <CardDescription>Sarah Johnson • Wedding Photography</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p>You've received a deposit payment of ₹500 for the Johnson & Smith Wedding.</p>
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="outline" className="w-full">
                View Details
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedConversation && (
        <Dialog open={!!selectedConversation} onOpenChange={() => setSelectedConversation(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Conversation with User {selectedConversation.id}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[400px] pr-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 mb-4 ${
                    message.sender_id === providerId ? 'flex-row-reverse' : ''
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {message.sender_id === providerId ? 'P' : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`rounded-lg p-3 max-w-[70%] ${
                      message.sender_id === providerId
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
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function Payment() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight font-aeonik-medium">Payment Overview</h2>
        <Button className="font-aeonik">Withdraw Funds</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Available Balance</CardDescription>
            <CardTitle className="text-3xl">₹2,450.00</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-3xl">₹1,200.00</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total Earnings (2025)</CardDescription>
            <CardTitle className="text-3xl">₹8,750.00</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <h3 className="text-xl font-semibold mt-8">Recent Transactions</h3>
      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <div className="grid grid-cols-5 p-4 font-medium">
              <div>Client</div>
              <div>Event</div>
              <div>Date</div>
              <div>Amount</div>
              <div>Status</div>
            </div>
            <Separator />
            {[
              {
                client: "Sarah Johnson",
                event: "Wedding Photography",
                date: "Feb 28, 2025",
                amount: "$500.00",
                status: "Paid",
              },
              {
                client: "Mark Davis",
                event: "Corporate Event",
                date: "Feb 15, 2025",
                amount: "$750.00",
                status: "Paid",
              },
              {
                client: "Lisa Thompson",
                event: "Birthday Party",
                date: "Jan 30, 2025",
                amount: "$300.00",
                status: "Pending",
              },
              {
                client: "Robert Wilson",
                event: "Product Launch",
                date: "Jan 22, 2025",
                amount: "$1,200.00",
                status: "Paid",
              },
              {
                client: "Emily Clark",
                event: "Family Portraits",
                date: "Jan 10, 2025",
                amount: "$250.00",
                status: "Paid",
              },
            ].map((transaction, i) => (
              <div key={i} className="grid grid-cols-5 p-4 hover:bg-muted/50">
                <div>{transaction.client}</div>
                <div>{transaction.event}</div>
                <div>{transaction.date}</div>
                <div>{transaction.amount}</div>
                <div>
                  <Badge variant={transaction.status === "Paid" ? "default" : "outline"}>{transaction.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ProfileSettings() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight font-aeonik-medium">Profile & Settings</h2>
        <Button className="font-aeonik">Save Changes</Button>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4 items-start">
                <div className="flex flex-col items-center space-y-2">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src="/placeholder.svg" alt="Profile" />
                    <AvatarFallback>SP</AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm">
                    Change Photo
                  </Button>
                </div>

                <div className="grid w-full gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="firstName" className="text-sm font-medium">
                        First Name
                      </label>
                      <input
                        id="firstName"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        defaultValue="John"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="lastName" className="text-sm font-medium">
                        Last Name
                      </label>
                      <input
                        id="lastName"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        defaultValue="Doe"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      defaultValue="john.doe@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium">
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      defaultValue="(555) 123-4567"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
              <CardDescription>Update your service details and bio.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="businessName" className="text-sm font-medium">
                  Business Name
                </label>
                <input
                  id="businessName"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue="Creative Events Pro"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="services" className="text-sm font-medium">
                  Services Offered
                </label>
                <input
                  id="services"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue="Photography, Videography, Event Planning"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="bio" className="text-sm font-medium">
                  Bio
                </label>
                <textarea
                  id="bio"
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue="Professional photographer and videographer with over 10 years of experience specializing in weddings, corporate events, and special occasions."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="currentPassword" className="text-sm font-medium">
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-medium">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <Button>Update Password</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Control how you receive notifications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Email Notifications</h4>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <div className="h-6 w-11 cursor-pointer rounded-full bg-primary p-1">
                  <div className="h-4 w-4 rounded-full bg-primary-foreground transition-transform translate-x-5"></div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">SMS Notifications</h4>
                  <p className="text-sm text-muted-foreground">Receive notifications via text message</p>
                </div>
                <div className="h-6 w-11 cursor-pointer rounded-full bg-muted p-1">
                  <div className="h-4 w-4 rounded-full bg-muted-foreground transition-transform"></div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Push Notifications</h4>
                  <p className="text-sm text-muted-foreground">Receive notifications on your device</p>
                </div>
                <div className="h-6 w-11 cursor-pointer rounded-full bg-primary p-1">
                  <div className="h-4 w-4 rounded-full bg-primary-foreground transition-transform translate-x-5"></div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">Notification Types</h4>
                <div className="grid gap-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="bookings" className="h-4 w-4 rounded border-primary" defaultChecked />
                    <label htmlFor="bookings">New booking requests</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="messages" className="h-4 w-4 rounded border-primary" defaultChecked />
                    <label htmlFor="messages">Client messages</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="payments" className="h-4 w-4 rounded border-primary" defaultChecked />
                    <label htmlFor="payments">Payment notifications</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="reminders" className="h-4 w-4 rounded border-primary" defaultChecked />
                    <label htmlFor="reminders">Event reminders</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="marketing" className="h-4 w-4 rounded border-primary" />
                    <label htmlFor="marketing">Marketing and promotions</label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

