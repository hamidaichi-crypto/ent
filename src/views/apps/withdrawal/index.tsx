'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button' // Import Button

// Component Imports
import TableFilters from './TableFilters'
import WithdrawalListTable from './WithdrawalListTable'

// Type Imports
import type { WithdrawalType } from '@/types/apps/withdrawalTypes'

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

    // Calculate default dates
    const today = new Date()
    const twoWeeksAgo = new Date(today)
    twoWeeksAgo.setDate(today.getDate() - 14)

    const formatDate = (date: Date) => {
        const year = date.getFullYear()
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const day = date.getDate().toString().padStart(2, '0')

        return `${year}-${month}-${day}`
    }

    const defaultStartDate = formatDate(twoWeeksAgo)
    const defaultEndDate = formatDate(today)

    const [filters, setFilters] = useState<{
        status: string[]
        startDate: string
        endDate: string
    }>({
        status: ['PENDING', 'IN_PROGRESS', 'RISKY', 'INCOMPLETE_PAYOUT'],
        startDate: defaultStartDate, // Set default start date
        endDate: defaultEndDate // Set default end date
    })

    // State to trigger data fetch
    const [triggerFetch, setTriggerFetch] = useState(false)

    // Hooks
    const fetchData = useFetchData()

    const fetchWithdrawalData = async (page: number, perPage: number, currentFilters: typeof filters) => {
        try {
            setLoading(true)
            let queryString = `/withdrawals?page=${page}&per_page=${perPage}`

            currentFilters.status.forEach((s, index) => {
                queryString += `&status%5B${index}%5D=${s}`
            })
            if (currentFilters.startDate) {
                queryString += `&start_date=${currentFilters.startDate}`
            }
            if (currentFilters.endDate) {
                queryString += `&end_date=${currentFilters.endDate}`
            }

            const data = await fetchData(queryString)
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

    // Fetch data when triggerFetch is true
    useEffect(() => {
        if (triggerFetch) {
            fetchWithdrawalData(paginationData.current_page, paginationData.per_page, filters)
            setTriggerFetch(false) // Reset trigger after fetch
        }
    }, [triggerFetch, paginationData.current_page, paginationData.per_page, filters]) // Dependencies for fetch

    // Initial fetch on component mount
    useEffect(() => {
        // Trigger initial fetch with default filters
        setTriggerFetch(true)
    }, [])


    const handlePageChange = (newPage: number) => {
        // When changing page, we want to fetch immediately with current filters
        fetchWithdrawalData(newPage, paginationData.per_page, filters)
    }

    const handleRowsPerPageChange = (newPerPage: number) => {
        // When changing rows per page, we want to fetch immediately with current filters
        fetchWithdrawalData(1, newPerPage, filters) // Reset to first page when rows per page changes
    }

    const handleFilterChange = (newFilters: typeof filters) => {
        setFilters(newFilters)
        setPaginationData(prev => ({ ...prev, current_page: 1 })) // Reset to first page on filter change
    }

    // Handler for the search button
    const handleSearch = () => {
        setTriggerFetch(true)
        setPaginationData(prev => ({ ...prev, current_page: 1 })) // Reset to first page on search
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
                {/* <TableFilters
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onSearch={handleSearch} // Pass the search handler
                /> */}
                <WithdrawalListTable
                    tableData={withdrawalData}
                    paginationData={paginationData}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onSearch={handleSearch} // Pass handleSearch to WithdrawalListTable
                />
            </Grid>
        </Grid>
    )
}

export default WithdrawalList
