'use client';

import React, { useState } from 'react';
import { Star, CheckCircle, Send } from 'lucide-react';
import { useReviews, useSubmitReviewMutation } from '@/hooks/useReviews';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useLanguageStore } from '@/lib/stores/useLanguageStore';
import Link from 'next/link';

interface ReviewSectionProps {
  productId: string;
}

export function ReviewSection({ productId }: ReviewSectionProps) {
  const { data: reviews = [], isLoading } = useReviews(productId);
  const { mutate: submitReview, isPending } = useSubmitReviewMutation(productId);
  const user = useAuthStore((s) => s.user);
  const { t } = useLanguageStore();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const averageRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!comment.trim()) {
      setFeedbackMsg({ text: t('reviewPlaceholder'), isError: true });
      return;
    }

    submitReview(
      {
        product_id: productId,
        customer_id: user.id,
        rating,
        comment: comment.trim(),
      },
      {
        onSuccess: (res) => {
          if (res.success) {
            setFeedbackMsg({ text: res.message, isError: false });
            setComment('');
          } else {
            setFeedbackMsg({ text: res.message, isError: true });
          }
        },
      }
    );
  };

  return (
    <section className="mt-12 pt-8 border-t border-brand-border">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="font-serif text-xl font-bold text-brand-black">{t('reviewTitle')}</h3>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center text-amber-500">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <span className="font-bold text-sm text-brand-black">{averageRating} / 5</span>
            <span className="text-xs text-brand-gray">({reviews.length} {t('reviews')})</span>
          </div>
        </div>
      </div>

      {/* Review Submission Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-8 p-4 bg-brand-lightGray rounded border border-brand-border">
          <h4 className="text-xs font-bold uppercase tracking-wider text-brand-black mb-3">{t('leaveReview')}</h4>

          {feedbackMsg && (
            <div className={`p-2.5 mb-3 rounded text-xs ${feedbackMsg.isError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {feedbackMsg.text}
            </div>
          )}

          {/* Star selector */}
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="p-1 text-amber-500 hover:scale-110 transition"
              >
                <Star className={`w-5 h-5 ${star <= rating ? 'fill-current' : 'text-neutral-300'}`} />
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('reviewPlaceholder')}
            rows={3}
            className="w-full p-3 text-xs bg-white border border-brand-border rounded focus:border-brand-black focus:outline-none"
          />

          <button
            type="submit"
            disabled={isPending}
            className="mt-3 px-4 py-2 bg-brand-black text-white text-xs font-semibold rounded hover:bg-brand-charcoal transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isPending ? t('submittingReview') : t('submitReview')}</span>
          </button>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-brand-lightGray rounded text-center">
          <p className="text-xs text-brand-gray">
            <Link href="/login" className="font-bold text-brand-black underline">{t('profileLoginButton')}</Link> {t('mustLoginToReview')}
          </p>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <p className="text-xs text-brand-gray italic">{t('noReviews')}</p>
      ) : (
        <div className="space-y-4 divide-y divide-brand-border">
          {reviews.map((rev) => (
            <div key={rev.id} className="pt-4 first:pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-brand-black text-white text-[10px] font-bold flex items-center justify-center">
                    {rev.users?.full_name?.charAt(0) || 'C'}
                  </div>
                  <span className="text-xs font-bold text-brand-black">{rev.users?.full_name || 'Client'}</span>
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-brand-emerald font-medium">
                    <CheckCircle className="w-3 h-3" /> {t('verifiedCustomer')}
                  </span>
                </div>
                <div className="flex items-center text-amber-500">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-current" />
                  ))}
                </div>
              </div>

              {rev.comment && <p className="text-xs text-brand-black mt-2 leading-relaxed">{rev.comment}</p>}
              <p className="text-[10px] text-brand-gray mt-1">
                {new Date(rev.created_at).toLocaleDateString('fr-FR', { dateStyle: 'medium' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
