"use server";

import { createClient } from "@/shared/lib/supabase/server";

interface ToggleChannelResult {
  success: boolean;
  enabled?: boolean;
  error?: string;
}

export async function toggleChannelAction(
  channelId: string,
  enabled: boolean
): Promise<ToggleChannelResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("channel_connections")
    .update({ is_active: enabled })
    .eq("id", channelId)
    .select("is_active")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, enabled: data.is_active };
}
