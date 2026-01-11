import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import { createClient } from "@supabase/supabase-js";

// Create Supabase admin client for user management
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        FacebookProvider({
            clientId: process.env.FACEBOOK_CLIENT_ID || "",
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
        }),
    ],
    callbacks: {
        async signIn({ user }) {
            if (!user.email) return false;

            try {
                // Check if user exists in Supabase Auth
                const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
                const existingUser = users?.find(u => u.email === user.email);

                let supabaseUserId: string;

                if (!existingUser) {
                    // Create new user in Supabase Auth
                    const { data: newAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                        email: user.email,
                        email_confirm: true,
                        user_metadata: {
                            name: user.name,
                            avatar_url: user.image,
                        }
                    });

                    if (createError || !newAuthUser.user) {
                        console.error("Error creating Supabase auth user:", createError);
                        return false;
                    }

                    supabaseUserId = newAuthUser.user.id;

                    // Create user record in users table with pending status
                    const { error: insertError } = await supabaseAdmin
                        .from('users')
                        .insert({
                            id: supabaseUserId,
                            email: user.email,
                            name: user.name || 'Unknown',
                            phone: '', // Will need to be updated later
                            user_type: 'user',
                            status: 'pending',
                        });

                    if (insertError) {
                        console.error("Error creating user record:", insertError);
                        return false;
                    }
                } else {
                    supabaseUserId = existingUser.id;

                    // Update existing user's name, avatar, and last_sign_in_at
                    await supabaseAdmin
                        .from('users')
                        .update({
                            name: user.name || 'Unknown',
                            last_sign_in_at: new Date().toISOString(),
                        })
                        .eq('id', supabaseUserId);
                }

                // Store Supabase user ID for use in session callback
                user.id = supabaseUserId;

                return true;
            } catch (error) {
                console.error("Error in signIn callback:", error);
                return false;
            }
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user && token.id) {
                const userId = token.id as string;
                session.user.id = userId;

                // Fetch user details from Supabase
                const { data: userData, error } = await supabaseAdmin
                    .from('users')
                    .select('user_type, status')
                    .eq('id', userId)
                    .single();

                if (!error && userData) {
                    session.user.userType = userData.user_type;
                    session.user.status = userData.status;
                } else {
                    // Default values if fetch fails
                    session.user.userType = 'user';
                    session.user.status = 'pending';
                }
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET,
};
