'use client'

import { useSession } from 'next-auth/react'

const BASE_URL = 'https://xpi.machibo.com/api'

export const useFetchData = () => {
    const { data: session } = useSession()
    const AUTH_TOKEN = session?.user?.accessToken ? `Bearer ${session.user.accessToken}` : ''

    const fetchData = async (endpoint: string) => {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': AUTH_TOKEN
            }
        })

        if (!res.ok) {
            throw new Error(`Failed to fetch data from ${endpoint}`)
        }

        return res.json()
    }

    return fetchData
}
