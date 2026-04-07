"use server"

import { createClient } from "@/shared/lib/supabase/server"

export async function toggleChannel(channelId: string, enabled: boolean): Promise<void> {
  const supabase = await createClient()

  // 현재 metadata를 읽어서 enabled 상태만 업데이트
  const { data: existing, error: fetchError } = await supabase
    .from("channel_connections")
    .select("metadata")
    .eq("id", channelId)
    .single()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  const updatedMetadata = {
    ...(existing.metadata ?? {}),
    enabled,
  }

  const { error: updateError } = await supabase
    .from("channel_connections")
    .update({ metadata: updatedMetadata })
    .eq("id", channelId)

  if (updateError) {
    throw new Error(updateError.message)
  }
}
