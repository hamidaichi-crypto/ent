'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const BASE_URL = 'https://xpi.machibo.com/api'

export const useFetchData = () => {
    const { data: session, status } = useSession()
    const [accessToken, setAccessToken] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        // If session is authenticated and has accessToken, store it in localStorage and state
        if (status === 'authenticated' && session?.user?.accessToken) {
            localStorage.setItem('accessToken', session.user.accessToken);
            setAccessToken(session.user.accessToken);
        }
        // If session is unauthenticated, clear localStorage and state
        else if (status === 'unauthenticated') {
            localStorage.removeItem('accessToken') // Clear localStorage
            setAccessToken(null)
            router.push('/login') // Redirect to login page
        }
        // If status is loading or null/undefined, try to get token from localStorage
        else if (!status || status === 'loading') {
            const storedToken = localStorage.getItem('accessToken');
            if (storedToken) {
                setAccessToken(storedToken);
            } else {
                // If no token in localStorage and not authenticated, ensure state is null
                setAccessToken(null);
            }
        }
    }, [session, status, router]); // Re-run effect if session, status, or router changes

    const fetchData = useCallback(async (endpoint: string) => {
        // Do not proceed if there is no access token.
        if (!accessToken) {
            // This can happen during initial load or after a logout.
            // You might want to throw an error or handle it gracefully.
            console.error('fetchData called without an access token.');
            throw new Error('Authentication token is not available.');
        }

        const AUTH_TOKEN = `Bearer ${accessToken}`;

        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': AUTH_TOKEN
            }
        });

        if (res.status === 401) {
            // If 401, clear localStorage and sign out
            localStorage.removeItem('accessToken');
            setAccessToken(null); // Also clear local state
            signOut({ callbackUrl: '/login' });
            throw new Error('Unauthorized. Logging out.');
        }

        if (!res.ok) {
            throw new Error(`Failed to fetch data from ${endpoint}`);
        }

        return res.json();
    }, [accessToken]); // Dependency on accessToken ensures the function has the correct token

    return fetchData
}

export const usePostData = () => {
    const { data: session, status } = useSession()
    const [accessToken, setAccessToken] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        if (status === 'authenticated' && session?.user?.accessToken) {
            localStorage.setItem('accessToken', session.user.accessToken)
            setAccessToken(session.user.accessToken)
        } else if (status === 'unauthenticated') {
            localStorage.removeItem('accessToken')
            setAccessToken(null)
            router.push('/login')
        } else if (!status || status === 'loading') {
            const storedToken = localStorage.getItem('accessToken')

            if (storedToken) {
                setAccessToken(storedToken)
            } else {
                setAccessToken(null)
            }
        }
    }, [session, status, router])

    const postData = async (endpoint: string, body: any) => {
        const AUTH_TOKEN = `Bearer ${accessToken}`

        console.log("URL", `${BASE_URL}${endpoint}`)
        console.log("JSON.stringify(body)", JSON.stringify(body))

        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': AUTH_TOKEN
            },
            body: JSON.stringify(body)
        })

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: `HTTP error! status: ${res.status}` }))
            throw new Error(errorData.message || `Failed to post data to ${endpoint}`)
        }

        return res.json()
    }

    return postData
}
