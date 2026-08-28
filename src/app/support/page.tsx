'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  MessageSquare, 
  Plus, 
  Send, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ChevronRight, 
  Phone, 
  MessageCircle, 
  HelpCircle,
  X,
  RefreshCw,
  User,
  Headphones
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { SupportService } from '@/lib/services/SupportService';
import { TicketThread, TicketMessage } from '@/types/schema';
import { supabase } from '@/lib/supabase/client';

const CATEGORIES = [
  'Problème de Commande / Livraison',
  'Paiement & Remboursement (Mobile Money / Cash)',
  'Authenticité & Qualité d’un Article',
  'Question sur une Boutique ou Vendeur',
  'Autre demande d’assistance'
];

export default function SupportPage() {
  const user = useAuthStore((s) => s.user);

  const [tickets, setTickets] = useState<TicketThread[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketThread | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // New Ticket Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [initialMessage, setInitialMessage] = useState('');
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reply Input State
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Fetch all customer tickets
  const loadTickets = async () => {
    if (!user?.id) return;
    setLoadingTickets(true);
    try {
      const data = await SupportService.getCustomerTickets(user.id);
      setTickets(data);
      if (data.length > 0 && !selectedTicket) {
        setSelectedTicket(data[0]);
      }
    } catch (err) {
      console.error('Error loading tickets:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadTickets();
    } else {
      setLoadingTickets(false);
    }
  }, [user?.id]);

  // 2. Fetch messages for selected ticket and subscribe to real-time additions
  useEffect(() => {
    if (!selectedTicket?.id) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    setLoadingMessages(true);

    const fetchMessages = async () => {
      const msgs = await SupportService.getTicketMessages(selectedTicket.id);
      if (isMounted) {
        setMessages(msgs);
        setLoadingMessages(false);
        setTimeout(scrollToBottom, 100);
      }
    };

    fetchMessages();

    // Subscribe to new messages on this thread
    const channel = supabase
      .channel(`support-chat-${selectedTicket.id}`)
      .on(
        'postgres_changes' as any,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_messages',
          filter: `thread_id=eq.${selectedTicket.id}`,
        },
        (payload: any) => {
          const newMsg = payload.new as TicketMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          setTimeout(scrollToBottom, 100);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [selectedTicket?.id]);

  // 3. Create Ticket Handler
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    if (!subject.trim() || !initialMessage.trim()) {
      setErrorMsg('Veuillez remplir le sujet et votre message.');
      return;
    }

    setCreatingTicket(true);
    setErrorMsg(null);

    try {
      const fullSubject = `[${category}] ${subject.trim()}`;
      const newThread = await SupportService.createTicket(user.id, fullSubject, initialMessage.trim());

      if (!newThread) throw new Error('Échec de la création du ticket.');

      setTickets((prev) => [newThread, ...prev]);
      setSelectedTicket(newThread);
      setShowNewModal(false);
      setSubject('');
      setInitialMessage('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la création du ticket.');
    } finally {
      setCreatingTicket(false);
    }
  };

  // 4. Send Message Reply Handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !selectedTicket?.id || !replyText.trim()) return;

    setSendingReply(true);
    try {
      const sent = await SupportService.sendMessage(selectedTicket.id, user.id, replyText.trim());
      if (sent) {
        setReplyText('');
        setMessages((prev) => {
          if (prev.some((m) => m.id === sent.id)) return prev;
          return [...prev, sent];
        });
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSendingReply(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-500 mx-auto mb-4">
          <Headphones className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-brand-black mb-2">
          Centre d'Assistance Zando Yetu
        </h1>
        <p className="text-xs sm:text-sm text-brand-gray max-w-md mx-auto mb-8">
          Connectez-vous pour ouvrir un ticket d'assistance, suivre vos réclamations et échanger en direct avec notre équipe support.
        </p>
        <Link
          href="/login?redirect=/support"
          className="inline-flex items-center gap-2 px-8 py-3 bg-brand-black text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-neutral-800 transition shadow-sm"
        >
          <span>Se Connecter au Support</span>
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">Ouvert</span>;
      case 'in_progress':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">En cours</span>;
      case 'resolved':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Résolu</span>;
      case 'closed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-600 border border-neutral-300">Fermé</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-800">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="mb-8 pb-4 border-b border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-black">Centre d'Assistance</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Support Actif
            </span>
          </div>
          <p className="text-xs text-brand-gray mt-1">
            Messagerie directe avec l'équipe d'administration & modération Zando Yetu Katanga.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2.5 bg-brand-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Ticket</span>
          </button>

          <a
            href="https://wa.me/243830634340?text=Bonjour%20Zando%20Yetu,%20j'ai%20besoin%20d'une%20assistance%20urgente"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 shadow-sm"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp Direct</span>
          </a>
        </div>
      </div>

      {/* Main Support Grid (Tickets Sidebar + Conversation Area) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Tickets List (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-brand-border rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-brand-border">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-black flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" />
              <span>Mes Tickets ({tickets.length})</span>
            </h2>
            <button
              type="button"
              onClick={loadTickets}
              disabled={loadingTickets}
              className="p-1 text-brand-gray hover:text-brand-black transition"
              title="Rafraîchir"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingTickets ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loadingTickets ? (
            <div className="py-16 text-center text-brand-gray flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-brand-black" />
              <p className="text-xs">Chargement de vos tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="py-12 text-center text-brand-gray space-y-3">
              <HelpCircle className="w-8 h-8 mx-auto text-neutral-300" />
              <p className="text-xs">Vous n'avez aucun ticket ouvert.</p>
              <button
                type="button"
                onClick={() => setShowNewModal(true)}
                className="px-3.5 py-1.5 bg-brand-lightGray hover:bg-neutral-200 text-brand-black text-xs font-semibold rounded-lg transition"
              >
                Créer une demande
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {tickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTicket(t)}
                    className={`w-full text-left p-3 rounded-xl border transition flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                        : 'bg-brand-lightGray/60 hover:bg-brand-lightGray text-neutral-800 border-transparent hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-mono ${isSelected ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        #{t.id.slice(0, 6).toUpperCase()}
                      </span>
                      {getStatusBadge(t.status)}
                    </div>
                    <p className={`text-xs font-bold line-clamp-1 ${isSelected ? 'text-white' : 'text-brand-black'}`}>
                      {t.subject}
                    </p>
                    <span className={`text-[10px] ${isSelected ? 'text-neutral-400' : 'text-neutral-500'}`}>
                      {new Date(t.updated_at || t.created_at).toLocaleDateString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Active Ticket Chat Pane (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-brand-border rounded-2xl shadow-xs overflow-hidden flex flex-col min-h-[550px]">
          {selectedTicket ? (
            <>
              {/* Ticket Header Bar */}
              <div className="p-4 sm:p-5 border-b border-brand-border bg-neutral-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-brand-gray">
                      #{selectedTicket.id.slice(0, 6).toUpperCase()}
                    </span>
                    {getStatusBadge(selectedTicket.status)}
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-brand-black">
                    {selectedTicket.subject}
                  </h3>
                </div>

                <div className="text-[11px] text-brand-gray">
                  Ouvert le {new Date(selectedTicket.created_at).toLocaleDateString('fr-FR', { dateStyle: 'medium' })}
                </div>
              </div>

              {/* Chat Messages Area */}
              <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[420px] bg-neutral-50/40">
                {loadingMessages ? (
                  <div className="py-16 text-center text-brand-gray flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-black" />
                    <p className="text-xs">Chargement de la conversation...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-12 text-center text-brand-gray text-xs">
                    Aucun message dans ce fil.
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.sender_id === user.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 text-[10px] text-neutral-400">
                          <span>{isMe ? 'Vous' : 'Support Officiel Zando Yetu'}</span>
                          <span>•</span>
                          <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div
                          className={`max-w-md sm:max-w-lg p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                            isMe
                              ? 'bg-brand-black text-white rounded-tr-none'
                              : 'bg-white text-neutral-900 border border-brand-border rounded-tl-none'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{m.message_body}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Reply Box */}
              {selectedTicket.status !== 'closed' ? (
                <form onSubmit={handleSendMessage} className="p-4 border-t border-brand-border bg-white flex items-center gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Écrivez votre message à l'administration..."
                    className="flex-1 px-4 py-2.5 text-xs bg-brand-lightGray border border-brand-border rounded-xl focus:border-brand-black focus:bg-white focus:outline-none transition"
                  />
                  <button
                    type="submit"
                    disabled={sendingReply || !replyText.trim()}
                    className="px-4 py-2.5 bg-brand-black hover:bg-neutral-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold uppercase transition flex items-center gap-1.5 shadow-sm"
                  >
                    {sendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span className="hidden sm:inline">Envoyer</span>
                  </button>
                </form>
              ) : (
                <div className="p-4 bg-neutral-100 text-center text-xs text-neutral-500 font-medium">
                  Ce ticket a été clôturé par l'équipe d'administration.
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 py-32 flex flex-col items-center justify-center text-brand-gray text-center p-6 space-y-3">
              <MessageSquare className="w-12 h-12 text-neutral-300" />
              <h3 className="font-bold text-sm text-brand-black">Sélectionnez un ticket pour afficher la conversation</h3>
              <p className="text-xs text-neutral-500 max-w-sm">
                Ou cliquez sur "Nouveau Ticket" pour soumettre une nouvelle réclamation.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-brand-border space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div className="flex items-center gap-2">
                <Headphones className="w-5 h-5 text-amber-500" />
                <h3 className="font-serif text-lg font-bold text-brand-black">Ouvrir un Ticket d'Assistance</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="text-neutral-400 hover:text-brand-black transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-black mb-1.5">
                  Catégorie du Problème *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-brand-lightGray border border-brand-border rounded-xl focus:border-brand-black focus:bg-white focus:outline-none transition cursor-pointer"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-black mb-1.5">
                  Sujet / Titre de la Demande *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex: Retard de livraison commande #CMD-1234, Question taille..."
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-brand-lightGray border border-brand-border rounded-xl focus:border-brand-black focus:bg-white focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-black mb-1.5">
                  Description détaillée de votre demande *
                </label>
                <textarea
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  rows={4}
                  placeholder="Expliquez clairement votre situation pour permettre à un conseiller de vous répondre rapidement..."
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-brand-lightGray border border-brand-border rounded-xl focus:border-brand-black focus:bg-white focus:outline-none transition resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-brand-black text-xs font-semibold rounded-xl transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creatingTicket}
                  className="px-6 py-2.5 bg-brand-black hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition flex items-center gap-2 shadow-sm"
                >
                  {creatingTicket ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Créer le Ticket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
