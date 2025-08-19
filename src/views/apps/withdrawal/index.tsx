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

// Utils Imports
import { useFetchData } from '@/utils/api'

const WithdrawalList = () => {
    // States
    const [withdrawalData, setWithdrawalData] = useState<WithdrawalType[] | undefined>(undefined)
    const [loading, setLoading] = useState<boolean>(true)
    const [paginationData, setPaginationData] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 30,
        total: 0
    })

    // Hooks
    const fetchData = useFetchData()

    const fetchWithdrawalData = async (page: number, perPage: number) => {
        try {
            setLoading(true)
            const data = await fetchData(`/withdrawals?page=${page}&per_page=${perPage}`)
            setWithdrawalData(data?.data?.rows)
            setPaginationData(data?.data?.paginations)
        } catch (error) {
            console.error('Failed to fetch withdrawal data:', error)
            setWithdrawalData([]) // Set to empty array on error
            setPaginationData({ current_page: 1, last_page: 1, per_page: 30, total: 0 })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchWithdrawalData(paginationData.current_page, paginationData.per_page)
    }, []) // Initial fetch

    const handlePageChange = (newPage: number) => {
        fetchWithdrawalData(newPage, paginationData.per_page)
    }

    const handleRowsPerPageChange = (newPerPage: number) => {
        fetchWithdrawalData(1, newPerPage) // Reset to first page when rows per page changes
    }

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
                <WithdrawalListTable
                    tableData={withdrawalData}
                    paginationData={paginationData}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                />
            </Grid>
        </Grid>
    )
}

export default WithdrawalList
