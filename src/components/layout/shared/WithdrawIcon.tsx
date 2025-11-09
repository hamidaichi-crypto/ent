'use client'

// React Imports
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, usePathname, useParams } from 'next/navigation'


// MUI Imports
import Badge from '@mui/material/Badge'
import IconButton from '@mui/material/IconButton'

import type { Locale } from '@configs/i18n'

// Utils Imports
import { useFetchData } from '@/utils/api'
import { useSession } from 'next-auth/react'
import { getLocalizedUrl } from '@/utils/i18n'

const WithdrawIcon = () => {
    const [pendingCount, setPendingCount] = useState(0)
    const [hasInteracted, setHasInteracted] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const fetchData = useFetchData()
    const { data: session, status } = useSession()
    const router = useRouter()
    const pathname = usePathname()
    const { lang: locale } = useParams()
    const previousPendingCount = useRef(0);


    // On the client-side, create the Audio object.
    // I'm assuming the sound file will be moved to the `public/sounds/` directory.
    useEffect(() => {
        audioRef.current = new Audio('/sounds/notification-sound.mp3')
        audioRef.current.muted = true; // Mute by default
        document.addEventListener('click', () => {
            setHasInteracted(true);
            if (audioRef.current) {
                audioRef.current.muted = false;
            }
        }, { once: true });
    }, [])

    const handleClick = useCallback(() => {
        const targetUrl = getLocalizedUrl('/apps/withdrawal', locale as Locale)
        setPendingCount(0)
        if (pathname !== targetUrl) {
            router.push(targetUrl)
        }
    }, [router, pathname, locale])

    const fetchPendingWithdrawals = async () => {
        if (status !== 'authenticated' || !session?.user?.accessToken) {
            return
        }

        try {
            // We only care about the count, so we can ask for a single item.
            const data = await fetchData('/withdrawals?per_page=1&status%5B0%5D=PENDING')

            const newTotal = data?.data?.paginations?.total

            if (hasInteracted && audioRef.current && newTotal > 0) {
                audioRef.current?.play().catch(e => console.error('Error playing sound:', e))
            }

            setPendingCount(newTotal || 0)
            previousPendingCount.current = newTotal || 0;
        } catch (error) {
            console.error('Failed to fetch pending withdrawal count:', error)
        }
    }

    useEffect(() => {
        if (status === 'authenticated') {
            fetchPendingWithdrawals()

            // Set up an interval to refetch the count 30 seconds
            const interval = setInterval(fetchPendingWithdrawals, 50000)

            // Cleanup interval on component unmount
            return () => clearInterval(interval)
        }
    }, [status, session, fetchData])

    return (
        <IconButton className='text-textPrimary' onClick={handleClick}>
            <Badge badgeContent={pendingCount} color='primary' max={99}>
                <i className='ri-upload-2-line' />
            </Badge>
        </IconButton>
    )
}

export default WithdrawIcon
