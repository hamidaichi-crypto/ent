'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

// Type Imports
import type { WithdrawalType } from '@/types/apps/withdrawalTypes'

// Component Imports
import WithdrawalListTable from './WithdrawalListTable'

const WithdrawalList = () => {
    // States
    const [withdrawalData, setWithdrawalData] = useState<WithdrawalType[] | undefined>(undefined)
    const [loading, setLoading] = useState<boolean>(true)

    useEffect(() => {
        const getWithdrawalListData = async () => {
            // Vars
            const res = await fetch('https://xpi.machibo.com/api/withdrawals?page=1', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': 'Bearer 15|PacmxeDeHKdBg43SXxnUeFAGaZBqULLHJ6gOlBRH97d96a2a'
                }
            })

            if (!res.ok) {
                throw new Error('Failed to fetch withdrawal data')
            }

            return res.json()
        }

        const fetchData = async () => {
            try {
                setLoading(true)
                const data = await getWithdrawalListData()
                setWithdrawalData(data?.data?.rows)
            } catch (error) {
                console.error('Failed to fetch withdrawal data:', error)
                setWithdrawalData([]) // Set to empty array on error
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    if (loading) {
        return (
            <Box className='flex justify-center items-center min-bs-[200px]'>
                <CircularProgress />
            </Box>
        )
    }

    return (
        <Grid container spacing={6}>
            <Grid size={{ xs: 12 }}>
                <WithdrawalListTable tableData={withdrawalData} />
            </Grid>
        </Grid>
    )
}

export default WithdrawalList
