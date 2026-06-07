import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login`);
  }

  // Obtain authenticated user email from the session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/unauthorized`);
  }

  // Validate that the email exists in authorized_users and is active
  const { data: authUser, error: authError } = await supabase
    .from("authorized_users")
    .select("email, name, alias, is_admin")
    .eq("email", user.email)
    .eq("active", true)
    .single();

  if (authError || !authUser) {
    // Authorization failed — sign out and redirect to unauthorized page
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/unauthorized`);
  }

  // Authorization succeeded: check whether a Users record already exists
  const { data: existingUser } = await supabase
    .from("Users")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!existingUser) {
    // Auto-provision Users record from authorized_users data
    const { error: insertError } = await supabase.from("Users").insert({
      id: user.id,
      email: authUser.email,
      name: authUser.name,
      alias: authUser.alias,
      isAdmin: authUser.is_admin,
    });

    if (insertError) {
      // The trigger may have already created the record — log and continue
      console.error(
        "Failed to auto-provision Users record:",
        insertError.message,
      );
    }
  }

  // Continue normal application access
  return NextResponse.redirect(`${origin}/portal`);
}
