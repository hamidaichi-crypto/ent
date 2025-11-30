'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

// Component Imports
import WithdrawalLogListTable from './WithdrawalLogTable'

// Type Imports
import type { WithdrawalLogType } from '@/types/apps/withdrawalTypes'

// Utils Imports
import { useFetchData } from '@/utils/api'

const WithdrawalList = () => {
  // States
  const [withdrawalData, setWithdrawalData] = useState<WithdrawalLogType[] | undefined>(undefined)
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

  const fetchWithdrawalLogData = async (page: number, perPage: number, currentFilters: typeof filters, showSpinner = true) => {
    console.log("fetchWithdrawalLogData called")
    try {
      if (showSpinner) {
        setLoading(true)
      }
      let queryString = `/withdrawals/logs?page=${page}&per_page=${perPage}`

      currentFilters.status.forEach((s, index) => {
        queryString += `&status%5B${index}%5D=${s}`
      })
      if (currentFilters.startDate) {
        queryString += `&start_date=${currentFilters.startDate}`
      }
      if (currentFilters.endDate) {
        queryString += `&end_date=${currentFilters.endDate}`
      }

      console.log("fetchWithdrawalLogData called fetcdhdata")
      const data = await fetchData(queryString)
      setWithdrawalData(data?.data?.logs)
      setPaginationData({
        current_page: data?.data?.paginations.current_page,
        last_page: data?.data?.paginations.last_page,
        per_page: data?.data?.paginations.per_page,
        total: data?.data?.paginations.total
      })
    } catch (error) {
      console.error('Failed to fetch withdrawal data:', error)
      setWithdrawalData([]) // Set to empty array on error
      setPaginationData({ current_page: 1, last_page: 1, per_page: 30, total: 0 })
    } finally {
      if (showSpinner) {
        setLoading(false)
      }
    }
  }

  // Fetch data when triggerFetch is true
  useEffect(() => {
    if (triggerFetch) {
      fetchWithdrawalLogData(1, 10, filters)
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
    fetchWithdrawalLogData(newPage, paginationData.per_page, filters)
  }

  const handleRowsPerPageChange = (newPerPage: number) => {
    // When changing rows per page, we want to fetch immediately with current filters
    fetchWithdrawalLogData(1, newPerPage, filters) // Reset to first page when rows per page changes
  }

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
    setPaginationData(prev => ({ ...prev, current_page: 1 })) // Reset to first page on filter change
  }

  // Handler for the search button
  const handleSearch = () => {
    // For auto-refresh, call fetch directly without the spinner
    fetchWithdrawalLogData(paginationData.current_page, paginationData.per_page, filters, false)
  }

  // Handler for manual search from filters
  const handleManualSearch = () => {
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
        <WithdrawalLogListTable
          tableData={withdrawalData}
          paginationData={paginationData}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          filters={filters}
          onFilterChange={handleFilterChange}
          onSearch={handleSearch} // Pass the background search handler to the table
          onManualSearch={handleManualSearch} // Pass manual search handler
        />
      </Grid>
    </Grid>
  )
}

export default WithdrawalList
