import { supabase } from '@/lib/supabase/client';
import { TicketThread, TicketMessage } from '@/types/schema';

export class SupportService {
  /**
   * Fetch all tickets belonging to a specific customer
   */
  static async getCustomerTickets(customerId: string): Promise<TicketThread[]> {
    if (!customerId) return [];
    try {
      const { data, error } = await supabase
        .from('ticket_threads')
        .select('*')
        .eq('customer_id', customerId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data || []) as TicketThread[];
    } catch (err) {
      console.error('[SupportService] Error fetching customer tickets:', err);
      return [];
    }
  }

  /**
   * Create a new support ticket and send the initial message atomically
   */
  static async createTicket(
    customerId: string,
    subject: string,
    initialMessage: string
  ): Promise<TicketThread | null> {
    if (!customerId || !subject.trim() || !initialMessage.trim()) return null;

    try {
      // 1. Create ticket thread
      const { data: thread, error: threadError } = await (supabase
        .from('ticket_threads')
        .insert({
          customer_id: customerId,
          subject: subject.trim(),
          status: 'open',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any)
        .select()
        .single() as any);

      if (threadError || !thread) throw threadError;

      // 2. Insert initial message
      const { error: msgError } = await (supabase
        .from('ticket_messages')
        .insert({
          thread_id: thread.id,
          sender_id: customerId,
          message_body: initialMessage.trim(),
          created_at: new Date().toISOString(),
        } as any) as any);

      if (msgError) {
        console.error('[SupportService] Error inserting initial message:', msgError);
      }

      return thread as TicketThread;
    } catch (err) {
      console.error('[SupportService] Error creating ticket:', err);
      return null;
    }
  }

  /**
   * Fetch all messages for a ticket thread
   */
  static async getTicketMessages(threadId: string): Promise<TicketMessage[]> {
    if (!threadId) return [];
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as TicketMessage[];
    } catch (err) {
      console.error('[SupportService] Error fetching ticket messages:', err);
      return [];
    }
  }

  /**
   * Send a reply message in a ticket thread
   */
  static async sendMessage(
    threadId: string,
    senderId: string,
    messageBody: string
  ): Promise<TicketMessage | null> {
    if (!threadId || !senderId || !messageBody.trim()) return null;

    try {
      const { data, error } = await (supabase
        .from('ticket_messages')
        .insert({
          thread_id: threadId,
          sender_id: senderId,
          message_body: messageBody.trim(),
          created_at: new Date().toISOString(),
        } as any)
        .select()
        .single() as any);

      if (error) throw error;

      // Update thread timestamp
      await (supabase
        .from('ticket_threads')
        .update({
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', threadId) as any);

      return data as TicketMessage;
    } catch (err) {
      console.error('[SupportService] Error sending ticket message:', err);
      return null;
    }
  }

  /**
   * Close a support ticket
   */
  static async closeTicket(threadId: string): Promise<boolean> {
    if (!threadId) return false;
    try {
      const { error } = await (supabase
        .from('ticket_threads')
        .update({
          status: 'closed',
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', threadId) as any);

      return !error;
    } catch (err) {
      console.error('[SupportService] Error closing ticket:', err);
      return false;
    }
  }
}
