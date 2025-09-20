'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
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

    // Only return fetchData if the session is authenticated AND we have a valid accessToken
    // The check for !accessToken is crucial here.
    if (status !== 'authenticated' || !accessToken) {
        // return () => {
        //     console.log(`Session status: ${status}, Access token: ${accessToken}. Authentication required or session loading.`);
        //     return Promise.reject(new Error("Authentication required or session loading."));
        // };
    }

    const AUTH_TOKEN = `Bearer ${accessToken}`;

    console.log("AUTH_TOKEN", AUTH_TOKEN)

    const fetchData = async (endpoint: string) => {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': AUTH_TOKEN
            }
        })

        if (res.status === 401) {
            // If 401, clear localStorage and sign out
            localStorage.removeItem('accessToken');
            setAccessToken(null); // Also clear local state
            // signOut();
            throw new Error('Unauthorized. Logging out.');
        }

        if (!res.ok) {
            throw new Error(`Failed to fetch data from ${endpoint}`)
        }

        return res.json()
    }

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
