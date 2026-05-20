'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  MessageCircle,
  Send,
  X,
  Clock,
  User,
  CheckCircle2,
  Volume2,
  VolumeX,
  Bell,
} from 'lucide-react';

interface Session {
  id: string;
  visitor_id: string;
  visitor_name: string | null;
  status: 'waiting' | 'active' | 'closed';
  admin_id: string | null;
  created_at: string;
  updated_at: string;
}

interface ChatMessage {
  id: string;
  session_id: string;
  sender_type: 'visitor' | 'admin' | 'system';
  content: string;
  created_at: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminLiveChat() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reply, setReply] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const replyInputRef = useRef<HTMLInputElement>(null);
  const supabaseRef = useRef(createClient());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(
      'data:audio/wav;base64,UklGRlQFAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YTAFAACAgICAgICAgICBgYKDhIaIi42PkZOVl5manJ6goqSmqKqsrq+xsrO0tLSzsrGvraylopyWkIqEf3t4dnV2eHuAhoySmaGor7W6vsPHysvMy8nGwby2r6ihmZGKg314dHJycnR4fYOLk5yksLm/xcvP0tTU09HPy8bAvbavqJ+Xj4iCfXl2dHR1eH2Ei5OcpK6zu8HHz9PV1tXUzsvFv7myrKWdlY2Gf3p2c3JydHl+hY2Vn6i0vcTK0NTV1NPRzMfBurSspaCalJCNi4qJiYqMjpGUl5qdn6Gio6OjoZ+cmZaTkI6Nh4F7'
    );
  }, []);

  const playNotificationSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, [soundEnabled]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const sendBrowserNotification = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/aquador.webp' });
    }
  }, []);

  // Load sessions + poll every 3s (Realtime as bonus)
  const prevSessionCountRef = useRef(0);
  useEffect(() => {
    const supabase = supabaseRef.current;

    const loadSessions = async () => {
      const { data } = await supabase
        .from('live_chat_sessions')
        .select('*')
        .in('status', ['waiting', 'active'])
        .order('created_at', { ascending: false });
      if (data) {
        const newSessions = data as unknown as Session[];
        // Notify if new sessions appeared
        if (newSessions.length > prevSessionCountRef.current && prevSessionCountRef.current > 0) {
          playNotificationSound();
          sendBrowserNotification('New Live Chat', 'A customer is waiting to chat with you!');
        }
        prevSessionCountRef.current = newSessions.length;
        setSessions(newSessions);
      }
    };

    loadSessions();
    const interval = setInterval(loadSessions, 3000);

    // Also try Realtime for instant delivery
    const channel = supabase
      .channel('admin-live-chat-sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_chat_sessions' }, () => loadSessions())
      .subscribe();

    return () => { clearInterval(interval); supabase.removeChannel(channel); };
  }, [playNotificationSound, sendBrowserNotification]);

  // Load + poll messages for active session
  const activeSessionId = activeSession?.id ?? null;
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }

    const supabase = supabaseRef.current;

    const loadMessages = async () => {
      const { data } = await supabase
        .from('live_chat_messages')
        .select('*')
        .eq('session_id', activeSessionId)
        .order('created_at', { ascending: true });
      if (data) {
        const newMsgs = data as unknown as ChatMessage[];
        setMessages(prev => {
          // Check for new visitor messages for sound
          if (newMsgs.length > prev.length) {
            const latest = newMsgs[newMsgs.length - 1];
            if (latest.sender_type === 'visitor') playNotificationSound();
          }
          return newMsgs;
        });
      }
    };

    loadMessages();
    const interval = setInterval(loadMessages, 3000);

    // Also try Realtime
    const channel = supabase
      .channel(`admin-chat-msgs-${activeSessionId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_chat_messages', filter: `session_id=eq.${activeSessionId}` }, () => loadMessages())
      .subscribe();

    return () => { clearInterval(interval); supabase.removeChannel(channel); };
  }, [activeSessionId, playNotificationSound]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (activeSession) replyInputRef.current?.focus();
  }, [activeSession]);

  const acceptSession = async (session: Session) => {
    const supabase = supabaseRef.current;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (session.status === 'waiting') {
      await supabase
        .from('live_chat_sessions')
        .update({ status: 'active', admin_id: user.id })
        .eq('id', session.id);

      await supabase.from('live_chat_messages').insert({
        session_id: session.id,
        sender_type: 'system',
        content: 'An agent has joined the chat.',
      });
    }

    setActiveSession({ ...session, status: 'active', admin_id: user.id });
  };

  const handleSendReply = async () => {
    if (!reply.trim() || !activeSession) return;
    const content = reply.trim();
    setReply('');

    // Optimistic update — show message instantly
    const optimisticMsg: ChatMessage = { id: `opt-${Date.now()}`, session_id: activeSession.id, sender_type: 'admin', content, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, optimisticMsg]);

    await supabaseRef.current.from('live_chat_messages').insert({
      session_id: activeSession.id,
      sender_type: 'admin',
      content,
    });
  };

  const closeSession = async (sessionId: string) => {
    const supabase = supabaseRef.current;

    await supabase.from('live_chat_messages').insert({
      session_id: sessionId,
      sender_type: 'system',
      content: 'The agent has ended the chat. Thank you!',
    });

    await supabase
      .from('live_chat_sessions')
      .update({ status: 'closed', closed_at: new Date().toISOString() })
      .eq('id', sessionId);

    if (activeSession?.id === sessionId) {
      setActiveSession(null);
    }
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
  };

  const waitingSessions = sessions.filter((s) => s.status === 'waiting');
  const activeSessions = sessions.filter((s) => s.status === 'active');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-gold" />
            Live Chat
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {waitingSessions.length > 0 && (
              <span className="text-amber-400 font-medium">
                {waitingSessions.length} waiting
              </span>
            )}
            {waitingSessions.length > 0 && activeSessions.length > 0 && (
              <span> &middot; </span>
            )}
            {activeSessions.length > 0 && (
              <span className="text-green-400">
                {activeSessions.length} active
              </span>
            )}
            {sessions.length === 0 && 'No active chats'}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Live-agent requests appear here and also email info@aquadorcy.com.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              soundEnabled
                ? 'bg-gold/10 text-gold hover:bg-gold/20'
                : 'bg-gray-800 text-gray-500 hover:bg-gray-700'
            }`}
            title={
              soundEnabled ? 'Mute notifications' : 'Enable notifications'
            }
          >
            {soundEnabled ? (
              <Volume2 className="h-5 w-5" />
            ) : (
              <VolumeX className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
        {/* Session List */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
          <div className="p-3 border-b border-gray-800">
            <h2 className="text-sm font-semibold text-gray-300">
              Conversations
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2 p-4">
                <Bell className="h-8 w-8 text-gray-600" />
                <p className="text-sm text-center">
                  No active chats.
                  <br />
                  You{"'"}ll be notified when someone starts one.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => acceptSession(session)}
                    className={`w-full p-3 text-left hover:bg-gray-800/50 transition-colors ${
                      activeSession?.id === session.id
                        ? 'bg-gray-800 border-l-2 border-gold'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          session.status === 'waiting'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-green-500/10 text-green-400'
                        }`}
                      >
                        <User className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          Visitor {session.visitor_id.slice(0, 8)}
                        </p>
                        <div className="flex items-center gap-1.5">
                          {session.status === 'waiting' ? (
                            <>
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span className="text-[11px] text-amber-400">
                                Waiting
                              </span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-green-400" />
                              <span className="text-[11px] text-green-400">
                                Active
                              </span>
                            </>
                          )}
                          <span className="text-[11px] text-gray-500 ml-auto">
                            {timeAgo(session.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
          {activeSession ? (
            <>
              <div className="p-3 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      Visitor {activeSession.visitor_id.slice(0, 8)}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Started {timeAgo(activeSession.created_at)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => closeSession(activeSession.id)}
                  className="px-3 py-1.5 text-xs bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  End Chat
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.sender_type === 'admin'
                        ? 'justify-end'
                        : msg.sender_type === 'system'
                          ? 'justify-center'
                          : 'justify-start'
                    }`}
                  >
                    {msg.sender_type === 'system' ? (
                      <p className="text-[11px] text-gray-500 italic bg-gray-800 px-3 py-1 rounded-full">
                        {msg.content}
                      </p>
                    ) : (
                      <div
                        className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                          msg.sender_type === 'admin'
                            ? 'bg-gold text-dark'
                            : 'bg-gray-800 text-white'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">
                          {msg.content}
                        </p>
                        <p
                          className={`text-[10px] mt-1 ${
                            msg.sender_type === 'admin'
                              ? 'text-dark/60'
                              : 'text-gray-500'
                          }`}
                        >
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-3 border-t border-gray-800">
                <div className="flex items-center gap-2">
                  <input
                    ref={replyInputRef}
                    type="text"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                    placeholder="Type your reply..."
                    maxLength={2000}
                    className="flex-1 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 px-4 py-2.5 text-sm rounded-xl focus:outline-none focus:border-gold transition-colors"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!reply.trim()}
                    className="bg-gold text-dark p-2.5 rounded-xl hover:bg-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-3">
              <MessageCircle className="h-12 w-12 text-gray-700" />
              <p className="text-sm">Select a conversation to start chatting</p>
              {waitingSessions.length > 0 && (
                <p className="text-xs text-amber-400">
                  {waitingSessions.length} customer
                  {waitingSessions.length > 1 ? 's' : ''} waiting!
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
