import * as Sentry from "@sentry/nextjs"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export interface KnowledgeEntry {
  id: string
  category: "state-law" | "procedure" | "compliance" | "general"
  state?: string
  question: string
  answer: string
  tags: string[]
  sources: string[]
  created_at: Date
  updated_at: Date
}

export async function addKnowledgeEntry(entry: Omit<KnowledgeEntry, "id" | "created_at" | "updated_at">) {
  return Sentry.startSpan({ op: "db.insert", name: "Add Knowledge Entry" }, async () => {
    const supabase = await createSupabaseServerClient()

    const { data, error } = await supabase
      .from("knowledge_base")
      .insert({
        category: entry.category,
        state: entry.state,
        question: entry.question,
        answer: entry.answer,
        tags: entry.tags,
        sources: entry.sources,
      })
      .select()
      .single()

    if (error) {
      Sentry.captureException(error)
      throw error
    }

    return data
  })
}

export async function searchKnowledgeBase(query: string, category?: string, state?: string) {
  return Sentry.startSpan({ op: "db.query", name: "Search Knowledge Base" }, async (span) => {
    const supabase = await createSupabaseServerClient()

    span.setAttribute("query", query)
    span.setAttribute("category", category || "all")
    span.setAttribute("state", state || "all")

    let queryBuilder = supabase.from("knowledge_base").select("*").textSearch("question", query.split(" ").join(" | "))

    if (category) {
      queryBuilder = queryBuilder.eq("category", category)
    }

    if (state) {
      queryBuilder = queryBuilder.eq("state", state)
    }

    const { data, error } = await queryBuilder.limit(10)

    if (error) {
      Sentry.captureException(error)
      throw error
    }

    return data as KnowledgeEntry[]
  })
}

export async function getKnowledgeByState(state: string) {
  return Sentry.startSpan({ op: "db.query", name: "Get State Knowledge" }, async (span) => {
    const supabase = await createSupabaseServerClient()

    span.setAttribute("state", state)

    const { data, error } = await supabase
      .from("knowledge_base")
      .select("*")
      .eq("state", state)
      .order("created_at", { ascending: false })

    if (error) {
      Sentry.captureException(error)
      throw error
    }

    return data as KnowledgeEntry[]
  })
}

export async function getKnowledgeByCategory(category: string) {
  return Sentry.startSpan({ op: "db.query", name: "Get Category Knowledge" }, async (span) => {
    const supabase = await createSupabaseServerClient()

    span.setAttribute("category", category)

    const { data, error } = await supabase
      .from("knowledge_base")
      .select("*")
      .eq("category", category)
      .order("created_at", { ascending: false })

    if (error) {
      Sentry.captureException(error)
      throw error
    }

    return data as KnowledgeEntry[]
  })
}

export async function updateKnowledgeEntry(id: string, updates: Partial<KnowledgeEntry>) {
  return Sentry.startSpan({ op: "db.update", name: "Update Knowledge Entry" }, async (span) => {
    const supabase = await createSupabaseServerClient()

    span.setAttribute("entry_id", id)

    const { data, error } = await supabase.from("knowledge_base").update(updates).eq("id", id).select().single()

    if (error) {
      Sentry.captureException(error)
      throw error
    }

    return data
  })
}

export async function deleteKnowledgeEntry(id: string) {
  return Sentry.startSpan({ op: "db.delete", name: "Delete Knowledge Entry" }, async (span) => {
    const supabase = await createSupabaseServerClient()

    span.setAttribute("entry_id", id)

    const { error } = await supabase.from("knowledge_base").delete().eq("id", id)

    if (error) {
      Sentry.captureException(error)
      throw error
    }

    return true
  })
}
