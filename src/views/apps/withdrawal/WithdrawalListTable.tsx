'use client'

// React Imports
import { useState, useMemo } from 'react'

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

    // Hooks
    const { lang: locale } = useParams()

    const columns = useMemo<ColumnDef<WithdrawalTypeWithAction, any>[]>(
        () => [
            {
                id: 'select',
                header: ({ table }) => (
                    <Checkbox
                        {...{
                            checked: table.getIsAllRowsSelected(),
                            indeterminate: table.getIsSomeRowsSelected(),
                            onChange: table.getToggleAllRowsSelectedHandler()
                        }}
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        {...{
                            checked: row.getIsSelected(),
                            disabled: !row.getCanSelect(),
                            indeterminate: row.getIsSomeSelected(),
                            onChange: row.getToggleSelectedHandler()
                        }}
                    />
                )
            },
            columnHelper.accessor('action', {
                header: 'Action',
                cell: ({ row }) => (
                    <div className='flex items-center gap-0.5'>
                        {/* <IconButton size='small' onClick={() => setData(data?.filter(product => product.id !== row.original.id))}>
                            <i className='ri-delete-bin-7-line text-textSecondary' />
                        </IconButton> */}
                        <IconButton size='small'>
                            <Link href={getLocalizedUrl('/apps/user/view', locale as Locale)} className='flex'>
                                <i className='ri-eye-line text-textSecondary' />
                            </Link>
                        </IconButton>
                        {/* <OptionMenu
                            iconClassName='text-textSecondary'
                            options={[
                                {
                                    text: 'Download',
                                    icon: 'ri-download-line'
                                },
                                {
                                    text: 'Edit',
                                    icon: 'ri-edit-box-line'
                                }
                            ]}
                        /> */}
                    </div>
                ),
                enableSorting: false
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
                cell: ({ row }) => <Typography>{row.original.member_bank_account}</Typography>
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
            {/* <AddUserDrawer
                open={addUserOpen}
                handleClose={() => setAddUserOpen(!addUserOpen)}
                userData={data}
                setData={setData}
            /> */}
        </>
    )
}

export default WithdrawalListTable
