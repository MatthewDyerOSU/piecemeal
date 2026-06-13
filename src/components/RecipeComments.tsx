"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import {
  addRecipeComment,
  deleteRecipeComment,
  type CommentFormState,
} from "@/app/recipes/actions";
import type { RecipeComment } from "@/types/recipe";

const initialState: CommentFormState = {};

/** Date like "13 Jun 2026, 2:30 PM" — stable and readable. */
function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Recipe comments: a shared notes thread for everyone with access to a
 * recipe to leave tweaks, substitutions, and tips. Posting clears and
 * refocuses the box; each comment can be removed by its author or by the
 * recipe's owner.
 */
export default function RecipeComments({
  recipeId,
  comments,
  currentUserId,
  isOwner,
}: {
  recipeId: string;
  comments: RecipeComment[];
  currentUserId: string;
  isOwner: boolean;
}) {
  const id = useId();
  const [state, formAction, pending] = useActionState(
    addRecipeComment,
    initialState
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (state.ok) {
      if (textareaRef.current) {
        textareaRef.current.value = "";
      }
      textareaRef.current?.focus();
    } else if (state.error) {
      textareaRef.current?.focus();
    }
  }, [state]);

  return (
    <section className="comments-section" aria-labelledby="comments-heading">
      <h2 className="eyebrow" id="comments-heading">
        Comments
      </h2>
      <p className="field-help">
        Share tweaks you made, substitutions, or tips. Everyone with access
        to this recipe can read and add comments.
      </p>

      <form action={formAction} className="comment-form">
        <input type="hidden" name="recipe-id" value={recipeId} />
        <div className="field">
          <label htmlFor={`${id}-body`}>Add a comment</label>
          <textarea
            ref={textareaRef}
            id={`${id}-body`}
            name="body"
            rows={3}
            maxLength={2000}
            aria-invalid={state.error ? true : undefined}
            aria-describedby={state.error ? `${id}-error` : undefined}
          />
          {state.error ? (
            <p id={`${id}-error`} role="alert" className="field-error">
              {state.error}
            </p>
          ) : null}
        </div>
        <button type="submit" className="button" disabled={pending}>
          {pending ? "Posting…" : "Post comment"}
        </button>
      </form>

      {comments.length === 0 ? (
        <p className="field-help comments-empty">
          No comments yet. Be the first to add a note.
        </p>
      ) : (
        <ul className="comment-list">
          {comments.map((comment) => {
            const canDelete =
              comment.user_id === currentUserId || isOwner;
            return (
              <li key={comment.id} className="comment">
                <div className="comment-head">
                  <p className="comment-meta">
                    <span className="comment-author">
                      {comment.author_name}
                    </span>
                    <span className="comment-when">
                      {formatWhen(comment.created_at)}
                    </span>
                  </p>
                  {canDelete ? (
                    <form action={deleteRecipeComment}>
                      <input
                        type="hidden"
                        name="comment-id"
                        value={comment.id}
                      />
                      <input
                        type="hidden"
                        name="recipe-id"
                        value={recipeId}
                      />
                      <button
                        type="submit"
                        className="button button-danger button-compact"
                      >
                        Delete
                        <span className="visually-hidden">
                          {" "}
                          comment by {comment.author_name}
                        </span>
                      </button>
                    </form>
                  ) : null}
                </div>
                <p className="comment-body">{comment.body}</p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
