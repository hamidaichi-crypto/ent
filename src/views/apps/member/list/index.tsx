'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

// Type Imports
import type { MemberType } from '@/types/apps/memberTypes'

// Component Imports
import MemberListTable from './MemberListTable'

const MemberList = () => {
    // States
    const [memberData, setMemberData] = useState<MemberType[] | undefined>(undefined)
    const [loading, setLoading] = useState<boolean>(true)

    useEffect(() => {
        const getMemberListData = async () => {
            // Vars
            const res = await fetch('https://xpi.machibo.com/api/members?page=1', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': 'Bearer 15|PacmxeDeHKdBg43SXxnUeFAGaZBqULLHJ6gOlBRH97d96a2a'
                }
            })

            if (!res.ok) {
                throw new Error('Failed to fetch member data')
            }

            return res.json()
        }

        const fetchData = async () => {
            try {
                setLoading(true)
                const data = await getMemberListData()
                setMemberData(data?.data?.rows)
            } catch (error) {
                console.error('Failed to fetch member data:', error)
                setMemberData([]) // Set to empty array on error
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
                <MemberListTable tableData={memberData} />
            </Grid>
        </Grid>
    )
}

export default MemberList
