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
    const [isMuted, setIsMuted] = useState(true)
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
        const savedMuteState = localStorage.getItem('isWithdrawalSoundMuted')
        const initialMuteState = savedMuteState ? JSON.parse(savedMuteState) : false

        setIsMuted(initialMuteState)
        audioRef.current = new Audio('/sounds/notification-sound.mp3')
        audioRef.current.muted = initialMuteState

        const handleFirstInteraction = () => {
            setHasInteracted(true);
            if (audioRef.current && !initialMuteState) {
                audioRef.current.muted = false
            }
        }

        document.addEventListener('click', handleFirstInteraction, { once: true });

        return () => {
            document.removeEventListener('click', handleFirstInteraction)
        }
    }, [])

    const handleClick = useCallback(() => {
        const targetUrl = getLocalizedUrl('/apps/withdrawal', locale as Locale)
        setPendingCount(0)
        if (pathname !== targetUrl) {
            router.push(targetUrl)
        }
    }, [router, pathname, locale])

    const handleMuteToggle = useCallback(() => {
        const newMutedState = !isMuted

        setIsMuted(newMutedState)
        localStorage.setItem('isWithdrawalSoundMuted', JSON.stringify(newMutedState))
        if (audioRef.current) {
            audioRef.current.muted = newMutedState
        }
    }, [isMuted])

    const fetchPendingWithdrawals = async () => {
        if (status !== 'authenticated' || !session?.user?.accessToken) {
            return;
        }

        try {
            // We only care about the count, so we can ask for a single item.
            const data = await fetchData('/withdrawals?per_page=100&status%5B0%5D=PENDING');

            const newRows = data?.data?.rows || [];
            const newIds = newRows.map((w: any) => w.id.toString());
            const newTotal = data?.data?.paginations?.total || 0;

            const storedIdsString = localStorage.getItem('pendingWithdrawalIds');
            const storedIds = storedIdsString ? JSON.parse(storedIdsString) : [];

            console.log("storedIds", storedIds)
            console.log("newIds", newIds)
            // Check if there are any new IDs in the fetched data that were not in storage.
            const hasNewWithdrawals = newIds.some((id: string) => !storedIds.includes(id));

            console.log("hasNewWithdrawals", hasNewWithdrawals)
            console.log("isMuted", isMuted)

            if (hasInteracted && !isMuted && hasNewWithdrawals && audioRef.current) {
                console.log("PLAY SOUND")
                audioRef.current?.play().catch(e => console.error('Error playing sound:', e));
            }

            // Update localStorage with the new list of IDs.
            localStorage.setItem('pendingWithdrawalIds', JSON.stringify(newIds));

            setPendingCount(newTotal);
        } catch (error) {
            console.error('Failed to fetch pending withdrawal count:', error);
        }
    }

    useEffect(() => {
        if (status === 'authenticated') {
            fetchPendingWithdrawals()

            // Set up an interval to refetch the count 30 seconds
            const interval = setInterval(fetchPendingWithdrawals, 30000)

            // Cleanup interval on component unmount
            return () => clearInterval(interval)
        }
    }, [status, session, fetchData])

    return (
        <>
            <IconButton className='text-textPrimary' onClick={handleClick}>
                <Badge badgeContent={pendingCount} color='primary' max={99}>
                    <i className='ri-upload-2-line' />
                </Badge>
            </IconButton>
            <IconButton className='text-textPrimary' onClick={handleMuteToggle}>
                <i className={isMuted ? 'ri-volume-mute-line' : 'ri-volume-up-line'} />
            </IconButton>
        </>
    )
}

export default WithdrawIcon
