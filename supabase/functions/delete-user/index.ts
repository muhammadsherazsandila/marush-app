import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const authorization = request.headers.get("Authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!token || !supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: "A valid signed-in session is required." }, 401);
  }

  try {
    const callerClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const {
      data: { user },
      error: userError,
    } = await callerClient.auth.getUser(token);

    if (userError || !user) {
      return jsonResponse({ error: "Your session is invalid or expired." }, 401);
    }

    let requestBody: { profileId?: unknown };
    try {
      requestBody = await request.json();
    } catch {
      return jsonResponse({ error: "A profileId is required." }, 400);
    }

    if (typeof requestBody.profileId !== "string") {
      return jsonResponse({ error: "A profileId is required." }, 400);
    }

    // This RPC evaluates the caller's persisted role under their JWT and
    // returns the Auth id only after enforcing superadmin deletion rules.
    const { data: authorizedRows, error: authorizationError } =
      await callerClient.rpc("authorize_profile_deletion", {
        p_profile_id: requestBody.profileId,
      });

    if (authorizationError) {
      const forbidden = authorizationError.code === "42501";
      const missing = authorizationError.code === "P0002";
      return jsonResponse(
        { error: authorizationError.message },
        forbidden ? 403 : missing ? 404 : 400,
      );
    }

    const target = authorizedRows?.[0] as
      | { profile_id: string; auth_user_id: string | null }
      | undefined;
    if (!target) {
      return jsonResponse({ error: "The account no longer exists." }, 404);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    if (target.auth_user_id) {
      const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(
        target.auth_user_id,
      );
      if (deleteAuthError) {
        return jsonResponse({ error: deleteAuthError.message }, 400);
      }
      // profiles.auth_user_id has ON DELETE CASCADE, so the profile and its
      // final-superadmin bootstrap trigger are handled in the same DB delete.
    } else {
      // Manually provisioned profiles may not yet have an Auth identity.
      const { error: deleteProfileError } = await adminClient
        .from("profiles")
        .delete()
        .eq("id", target.profile_id);
      if (deleteProfileError) {
        return jsonResponse({ error: deleteProfileError.message }, 400);
      }
    }

    return jsonResponse({ deleted: true, profileId: target.profile_id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return jsonResponse({ error: message }, 500);
  }
});
