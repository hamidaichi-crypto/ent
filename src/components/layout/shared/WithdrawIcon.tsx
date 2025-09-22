'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Badge from '@mui/material/Badge'
import IconButton from '@mui/material/IconButton'

// Utils Imports
import { useFetchData } from '@/utils/api'

const WithdrawIcon = () => {
    const [pendingCount, setPendingCount] = useState(0)
    const fetchData = useFetchData()

    const fetchPendingWithdrawals = async () => {
        try {
            // We only care about the count, so we can ask for a single item.
            const data = await fetchData('/withdrawals?per_page=1&status%5B0%5D=PENDING')
            console.log(data)

            if (data?.data?.paginations?.total) {
                console.log(data?.data?.paginations?.total)
                setPendingCount(data.data.paginations.total)
            }
        } catch (error) {
            console.error('Failed to fetch pending withdrawal count:', error)
        }
    }

    useEffect(() => {
        fetchPendingWithdrawals()

        // Set up an interval to refetch the count every minute
        const interval = setInterval(fetchPendingWithdrawals, 60000)

        // Cleanup interval on component unmount
        return () => clearInterval(interval)
    }, [fetchData])

    return (
        <IconButton className='text-textPrimary'>
            <Badge badgeContent={pendingCount} color='primary' max={99}>
                <i className='ri-upload-2-line' />
            </Badge>
        </IconButton>
    )
}

export default WithdrawIcon
