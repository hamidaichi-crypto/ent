'use client'

// React Imports
import { useEffect, useState, useMemo, useCallback, useRef } from 'react'


// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import { styled } from '@mui/material/styles'
import TablePagination from '@mui/material/TablePagination'

// Third-party Imports
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getFilteredRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFacetedMinMaxValues,
    getPaginationRowModel,
    getSortedRowModel
} from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import type { RankingInfo } from '@tanstack/match-sorter-utils'
import DialogAddNewWithdrawal from './DialogAddNewWithdrawal'

// Type Imports
import type { ThemeColor } from '@core/types'
import type { WithdrawalType } from '@/types/apps/withdrawalTypes'
import { Transaction } from '@/types/apps/withdrawalTypes'
import type { Locale } from '@configs/i18n'

// Component Imports
import TableFilters from './TableFilters'
import CustomAvatar from '@core/components/mui/Avatar'

// Util Imports
import { getInitials } from '@/utils/getInitials'
import { getLocalizedUrl } from '@/utils/i18n'
import { formatDateTime } from '@/utils/dateFormatter'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'


import {
    Tabs, Tab, Box, Grid, Table, TableBody, TableRow, TableCell,
    Chip, TextField
} from "@mui/material";

declare module '@tanstack/table-core' {
    interface FilterFns {
        fuzzy: FilterFn<unknown>
    }
    interface FilterMeta {
        itemRank: RankingInfo
    }
}

type WithdrawalTypeWithAction = WithdrawalType & {
    action?: string
}

// Styled Components
const Icon = styled('i')({})

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
    // Rank the item
    const itemRank = rankItem(row.getValue(columnId), value)

    // Store the itemRank info
    addMeta({
        itemRank
    })

    // Return if the item should be filtered in/out
    return itemRank.passed
}

// Column Definitions
const columnHelper = createColumnHelper<WithdrawalTypeWithAction>()

type PaginationData = {
    current_page: number
    last_page: number
    per_page: number
    total: number
}

// Define props type including onSearch
type WithdrawalListTableProps = {
    tableData?: WithdrawalType[]
    paginationData: PaginationData
    onPageChange: (page: number) => void
    onRowsPerPageChange: (perPage: number) => void
    filters: {
        status: string[]
        startDate: string
        endDate: string
    }
    onFilterChange: (newFilters: {
        status: string[]
        startDate: string
        endDate: string
    }) => void
    onSearch: () => void // Add onSearch prop
}

const getAccountNumber = (accountInfo: string | undefined) => {
    if (!accountInfo) {
        return '';
    }
    const parts = accountInfo.split(' - ');

    return parts[parts.length - 1].trim();
}

const WithdrawalListTable = ({
    tableData,
    paginationData,
    onPageChange,
    onRowsPerPageChange,
    filters,
    onFilterChange,
    onSearch // Receive onSearch prop
}: WithdrawalListTableProps) => {
    // States
    const [rowSelection, setRowSelection] = useState({})
    const [globalFilter, setGlobalFilter] = useState('')

    const [isWithdrawDetailModalOpen, setIsWithdrawDetailModalOpen] = useState(false)
    const [selectedWithdrawal, setSelectedWithdrawal] = useState({})

    // Hooks
    const { lang: locale } = useParams()

    const columns = useMemo<ColumnDef<WithdrawalTypeWithAction, any>[]>(
        () => [
            columnHelper.accessor('action', {
                header: 'Action',
                cell: ({ row }) => (
                    <div className='flex items-center gap-0.5'>
                        <IconButton size='small' onClick={() => {
                            setSelectedWithdrawal(row.original)
                            setIsWithdrawDetailModalOpen(true)
                        }}>
                            <i className='ri-eye-line text-textSecondary' />
                        </IconButton>
                    </div>
                ),
                enableSorting: false,
                meta: {
                    pinned: 'left'
                }
            }),
            columnHelper.accessor('id', {
                header: 'ID',
                cell: ({ row }) => <Typography>{row.original.id}</Typography>
            }),
            columnHelper.accessor('member_id', {
                header: 'Member ID',
                cell: ({ row }) => <Typography>{row.original.member_id}</Typography>
            }),
            columnHelper.accessor('username', {
                header: 'Username',
                cell: ({ row }) => <Typography>{row.original.username}</Typography>
            }),
            columnHelper.accessor('risk_score', {
                header: 'Risk Score',
                cell: ({ row }) => <Typography> - </Typography>
            }),
            columnHelper.accessor('grade', {
                header: 'Grade',
                cell: ({ row }) => <Typography>{row.original.grade}</Typography>
            }),
            columnHelper.accessor('status', {
                header: 'Status',
                cell: ({ row }) => <Typography>{row.original.status}</Typography>
            }),
            columnHelper.accessor('amount', {
                header: 'Amount',
                cell: ({ row }) => <Typography>{row.original.amount}</Typography>
            }),
            columnHelper.accessor('confirm_account', {
                header: 'Confirm Account',
                cell: ({ row }) => <Typography>{row.original.confirm_account}</Typography>
            }),
            columnHelper.accessor('member_bank', {
                header: 'Member Bank',
                cell: ({ row }) => <Typography>{row.original.member_bank}</Typography>
            }),
            columnHelper.accessor('member_bank_account', {
                header: 'Member Bank Account',
                cell: ({ row }) => <Typography>{getAccountNumber(row.original.member_bank_account)}</Typography>
            }),
            columnHelper.accessor('handler', {
                header: 'Handler',
                cell: ({ row }) => <Typography>{row.original.handler}</Typography>
            }),
            columnHelper.accessor('remarks', {
                header: 'Remark',
                cell: ({ row }) => <Typography>{row.original.remarks}</Typography>
            }),
            columnHelper.accessor('created_at', {
                header: 'Created Time',
                cell: ({ row }) => <Typography>{formatDateTime(row.original.created_at)}</Typography>
            }),
            columnHelper.accessor('updated_at', {
                header: 'Updated Time',
                cell: ({ row }) => <Typography>{formatDateTime(row.original.updated_at)}</Typography>
            }),
            columnHelper.accessor('processing_time', {
                header: 'Processing Time',
                cell: ({ row }) => <Typography>{formatDateTime(row.original.processing_time)}</Typography>
            }),
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [tableData]
    )

    const table = useReactTable({
        data: tableData as WithdrawalType[],
        columns,
        filterFns: {
            fuzzy: fuzzyFilter
        },
        state: {
            rowSelection,
            globalFilter,
            pagination: {
                pageIndex: paginationData.current_page - 1,
                pageSize: paginationData.per_page
            }
        },
        enableRowSelection: true, //enable row selection for all rows
        // enableRowSelection: row => row.original.age > 18, // or enable row selection conditionally per row
        globalFilterFn: fuzzyFilter,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        onGlobalFilterChange: setGlobalFilter,
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getFacetedMinMaxValues: getFacetedMinMaxValues(),
        manualPagination: true // We'll handle pagination ourselves
    })

    return (
        <>
            <Card>
                <CardHeader title='Withdrawal List' className='pbe-4' />
                {/* Pass onSearch prop to TableFilters */}
                <TableFilters filters={filters} onFilterChange={onFilterChange} onSearch={onSearch} />
                <Divider />
                <div className='flex justify-between gap-4 p-5 flex-col items-start sm:flex-row sm:items-center'>
                    {/* <Button
                        color='secondary'
                        variant='outlined'
                        startIcon={<i className='ri-upload-2-line' />}
                        className='max-sm:is-full'
                    >
                        Export
                    </Button> */}
                    <div className='flex items-center gap-x-4 max-sm:gap-y-4 flex-col max-sm:is-full sm:flex-row'>
                        <DialogAddNewWithdrawal />
                    </div>
                </div>
                <div className='overflow-x-auto'>
                    <table className={tableStyles.table}>
                        <thead>
                            {table.getHeaderGroups().map(headerGroup => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map(header => (
                                        <th key={header.id}>
                                            {header.isPlaceholder ? null : (
                                                <>
                                                    <div
                                                        className={classnames({
                                                            'flex items-center': header.column.getIsSorted(),
                                                            'cursor-pointer select-none': header.column.getCanSort()
                                                        })}
                                                        onClick={header.column.getToggleSortingHandler()}
                                                    >
                                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                                        {{
                                                            asc: <i className='ri-arrow-up-s-line text-xl' />,
                                                            desc: <i className='ri-arrow-down-s-line text-xl' />
                                                        }[header.column.getIsSorted() as 'asc' | 'desc'] ?? null}
                                                    </div>
                                                </>
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        {table.getRowModel().rows.length === 0 ? (
                            <tbody>
                                <tr>
                                    <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                                        No data available
                                    </td>
                                </tr>
                            </tbody>
                        ) : (
                            <tbody>
                                {table
                                    .getRowModel()
                                    .rows.map(row => {
                                        return (
                                            <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                                                {row.getVisibleCells().map(cell => (
                                                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                                                ))}
                                            </tr>
                                        )
                                    })}
                            </tbody>
                        )}
                    </table>
                </div>
                <TablePagination
                    rowsPerPageOptions={[10, 25, 50]}
                    component='div'
                    className='border-bs'
                    count={paginationData.total}
                    rowsPerPage={paginationData.per_page}
                    page={paginationData.current_page - 1}
                    SelectProps={{
                        inputProps: { 'aria-label': 'rows per page' }
                    }}
                    onPageChange={(_, page) => {
                        onPageChange(page + 1)
                    }}
                    onRowsPerPageChange={e => onRowsPerPageChange(Number(e.target.value))}
                />
            </Card>
            <UserWithdrawalModal
                withdrawal={selectedWithdrawal}
                open={isWithdrawDetailModalOpen}
                onClose={() => {
                    setIsWithdrawDetailModalOpen(false)
                    setSelectedWithdrawal({})
                }}
            />
            {/* <AddUserDrawer
                open={addUserOpen}
                handleClose={() => setAddUserOpen(!addUserOpen)}
                userData={data}
                setData={setData}
            /> */}
        </>
    )
}


// --- User Withdrawal Modal Component ---
const UserWithdrawalModal = ({
    withdrawal,
    open,
    onClose
}: { withdrawal: Transaction | null; open: boolean; onClose: () => void }) => {
    // const [userData, setUserData] = useState<MemberType | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    // const fetchData = useFetchData()

    // 🗂 Cache user data by username
    const cacheRef = useRef<Record<string, MemberType>>({})

    // Fetch user details (and update cache)
    // const loadUserData = async (uname: string) => {
    //     setLoading(true)
    //     setError(null)
    //     try {
    //         const response = await fetchData(`/members/u/${uname}`)
    //         setUserData(response?.data)
    //         cacheRef.current[uname] = response // ✅ cache it
    //     } catch (err) {
    //         console.error('Error fetching user data:', err)
    //         setError('Failed to load user data.')
    //     } finally {
    //         setLoading(false)
    //     }
    // }

    // useEffect(() => {
    //     if (!open || !username) return

    //     // ✅ If cached, use it immediately
    //     if (cacheRef.current[username]) {
    //         setUserData(cacheRef.current[username])
    //         setLoading(false)
    //         setError(null)
    //     } else {
    //         // Otherwise fetch from API
    //         loadUserData(username)
    //     }
    // }, [username, open])

    // Don’t clear cache on close → only reset modal state
    useEffect(() => {
        if (!open) {
            setError(null)
            setLoading(false)
            // setUserData(null) // clear local state, but keep cache
        }
    }, [open])

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>Withdrawal Details</DialogTitle>
            {withdrawal && (
                <DialogContent>
                    {/* Tabs */}
                    <Tabs value={0}>
                        <Tab label="Withdrawal Info" />
                    </Tabs>

                    {/* Member & Bank Info */}
                    <Grid container spacing={2} sx={{ mt: 2 }}>
                        <Grid item xs={12} md={6}>
                            <Box border={1} borderRadius={2} p={2}>
                                <h4>Member Info</h4>
                                <Table size="small">
                                    <TableBody>
                                        <TableRow>
                                            <TableCell>Username</TableCell>
                                            <TableCell>{withdrawal.username}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Member Group</TableCell>
                                            <TableCell>{withdrawal.member_group}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Merchant</TableCell>
                                            <TableCell>{withdrawal.merchant_name}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Remarks</TableCell>
                                            <TableCell>{withdrawal.remarks}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Box border={1} borderRadius={2} p={2}>
                                <h4>Bank Info</h4>
                                <Table size="small">
                                    <TableBody>
                                        <TableRow>
                                            <TableCell>Bank Name</TableCell>
                                            <TableCell>{withdrawal.member_bank}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Account Name</TableCell>
                                            <TableCell>{withdrawal.name}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Account Number</TableCell>
                                            <TableCell>{getAccountNumber(withdrawal.member_bank_account)}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Remarks</TableCell>
                                            <TableCell>-</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </Box>
                        </Grid>
                    </Grid>

                    {/* Transaction Info */}
                    <Box border={1} borderRadius={2} p={2} mt={3}>
                        <h4>Transaction Info</h4>
                        <Table size="small">
                            <TableBody>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>W{withdrawal.id}</TableCell>
                                    <TableCell>Created At</TableCell>
                                    <TableCell>{formatDateTime(withdrawal.created_at)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Status</TableCell>
                                    <TableCell>
                                        <Chip label={withdrawal.status_name} color="success" />
                                    </TableCell>
                                    <TableCell>Confirmed Amount</TableCell>
                                    <TableCell>{withdrawal.confirmed_amount}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Processing Date</TableCell>
                                    <TableCell>{formatDateTime(withdrawal.processing_time)}</TableCell>
                                    <TableCell>Handler</TableCell>
                                    <TableCell>{withdrawal.approved_by}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>

                        <Box mt={2}>
                            <TextField
                                label="Remark"
                                variant="outlined"
                                fullWidth
                                size="small"
                            />
                            <Button
                                variant="contained"
                                color="primary"
                                sx={{ mt: 2 }}
                            >
                                Update
                            </Button>
                        </Box>
                    </Box>
                </DialogContent>
            )}
        </Dialog>
        // <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        //     <DialogTitle>
        //         {withdrawal && (<> </>)}
        //         {/* User Details {username ? `- ${username}` : ''} */}
        //     </DialogTitle>
        //     <DialogContent>
        //         {loading && <Typography>Loading...</Typography>}
        //         {error && <Typography color="error">{error}</Typography>}
        //         {withdrawal && (
        //             <>
        //             </>
        //         )}
        //         <Button onClick={onClose} variant="contained" className="mt-2">
        //             Close
        //         </Button>
        //     </DialogContent>
        // </Dialog>
    )
}


export default WithdrawalListTable
