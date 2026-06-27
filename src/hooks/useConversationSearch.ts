"use client"

import { useCallback, useState } from "react"
import { useChat } from "./useChat"

export function useConversationSearch() {
  const [search, setSearch] = useState("")
  const [messageSearch, setMessageSearch] = useState("")
  const { data, isLoading, isFetching } = useChat(search || undefined)

  const onSearchChange = useCallback((value: string) => {
    setSearch(value)
  }, [])

  const onMessageSearchChange = useCallback((value: string) => {
    setMessageSearch(value)
  }, [])

  return {
    search,
    messageSearch,
    onSearchChange,
    onMessageSearchChange,
    conversations: data?.conversations ?? [],
    categories: data?.categories ?? [],
    isLoading,
    isFetching,
  }
}
