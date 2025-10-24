'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

// Type Imports
import type { MemberReportType } from '@/types/apps/memberReportTypes'

// Component Imports
import MemberReportListTable from './MemberReportListTable'

// Utils Imports
import { useFetchData } from '@/utils/api'

const MemberList = () => {
    // States
    const [memberReportData, setMemberReportData] = useState<MemberReportType[] | undefined>(undefined)
    const [loading, setLoading] = useState<boolean>(false)
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
        username: string,
        startDate: string
        endDate: string
    }>({
        username: '',
        startDate: defaultStartDate, // Set default start date
        endDate: defaultEndDate // Set default end date
    })

    // State to trigger data fetch
    const [triggerFetch, setTriggerFetch] = useState(false)

    // Hooks
    const fetchData = useFetchData()

    const fetchMemberReportData = async (currentFilters: typeof filters) => {
        console.log("fetchMemberReportData")
        try {
            setLoading(true)

            // let queryString = `/members?page=${page}&per_page=${perPage}`
            let queryString = `/members/game_reports?`

            if (currentFilters.username) {
                queryString += `&username=${currentFilters.username}`
            }
            if (currentFilters.startDate) {
                queryString += `&start_date=${currentFilters.startDate}`
            }
            if (currentFilters.endDate) {
                queryString += `&end_date=${currentFilters.endDate}`
            }

            console.log("qurery", queryString)

            const data = await fetchData(queryString)
            console.log("data", data)
            console.log("data?.report", data?.data?.report)
            setMemberReportData(data?.data?.report)
            // setPaginationData(data?.data?.paginations)
        } catch (error) {
            console.error('Failed to fetch member data:', error)
            setMemberReportData([]) // Set to empty array on error
            // setPaginationData({ current_page: 1, last_page: 1, per_page: 30, total: 0 })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        console.log("use effeasd fetcmamager", triggerFetch)
        if (triggerFetch) {
            console.log("use triggerFetch triggerFetch")
            fetchMemberReportData(filters)
            setTriggerFetch(false) // Reset trigger after fetch
        }
    }, [triggerFetch, paginationData.current_page, paginationData.per_page, filters]) // Dependencies for fetch

    // Initial fetch on component mount
    useEffect(() => {
        // Trigger initial fetch with default filters 
        setTriggerFetch(false) // TURN OFF INITIAL LOAD
    }, [])


    const handlePageChange = (newPage: number) => {
        fetchMemberReportData(filters)
    }

    const handleRowsPerPageChange = (newPerPage: number) => {
        fetchMemberReportData(filters) // Reset to first page when rows per page changes
    }

    const handleFilterChange = (newFilters: typeof filters) => {
        setFilters(newFilters)
        // setPaginationData(prev => ({ ...prev, current_page: 1 })) // Reset to first page on filter change
    }

    // Handler for the search button
    const handleSearch = () => {
        setTriggerFetch(true)
        // setPaginationData(prev => ({ ...prev, current_page: 1 })) // Reset to first page on search
    }

    const handleClear = () => {
        setFilters({
            username: '',
            startDate: defaultStartDate,
            endDate: defaultEndDate
        })
        setTriggerFetch(true)
        setPaginationData(prev => ({ ...prev, current_page: 1 }))
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
                <MemberReportListTable
                    tableData={memberReportData}
                    paginationData={paginationData}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onSearch={handleSearch} // Pass handleSearch to WithdrawalListTable
                    onClear={handleClear} // Pass handleSearch to WithdrawalListTable
                />
            </Grid>
        </Grid>
    )
}

export default MemberList
