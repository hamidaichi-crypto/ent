'use client'

// React Imports
import { useEffect, useState, useMemo } from 'react'

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


// Type Imports
import type { WithdrawalLogType, CrossBettingTransaction } from '@/types/apps/withdrawalTypes'
// Component Imports
import TableFilters from './TableFilters'
// Util Imports
import { formatDateTime } from '@/utils/dateFormatter'


// Style Imports
import tableStyles from '@core/styles/table.module.css'

// Third-party Style Imports
import 'react-toastify/dist/ReactToastify.css'
declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

type WithdrawalTypeWithAction = WithdrawalLogType & {
  action?: string
}

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
type WithdrawalLogTableProps = {
  tableData?: WithdrawalLogType[]
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
  onSearch: () => void
  onManualSearch: () => void
}

const WithdrawalLogTable = ({
  tableData,
  paginationData,
  onPageChange,
  onRowsPerPageChange,
  filters,
  onFilterChange,
  onSearch,
  onManualSearch
}: WithdrawalLogTableProps) => {
  // States
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')
  const columns = useMemo<ColumnDef<WithdrawalTypeWithAction, any>[]>(
    () => [
      columnHelper.accessor('id', {
        header: 'ID',
        cell: ({ row }) => <Typography>{row.original.id}</Typography>
      }),
      columnHelper.accessor('created_at', {
        header: 'Created At',
        cell: ({ row }) => <Typography>{formatDateTime(row.original.created_at)}</Typography>
      }),
      columnHelper.accessor('operator', {
        header: 'Operator',
        cell: ({ row }) => <Typography>{row.original.operator}</Typography>
      }),


      columnHelper.accessor('member_username', {
        header: 'Member Username',
        cell: ({ row }) => <Typography>{row.original.member_username}</Typography>
      }),
      columnHelper.accessor('member_id', {
        header: 'Member ID',
        cell: ({ row }) => <Typography>{row.original.member_id}</Typography>
      }),
      columnHelper.accessor('amount', {
        header: 'Amount',
        cell: ({ row }) => <Typography>{row.original.amount}</Typography>
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) => <Typography>{row.original.status}</Typography>
      }),
      columnHelper.accessor('member_bank_name', {
        header: 'Member Bank',
        cell: ({ row }) => <Typography> {row.original.member_bank_name} </Typography>
      }),
      columnHelper.accessor('member_account_number', {
        header: 'Member Account Number',
        cell: ({ row }) => <Typography>{row.original.member_account_number}</Typography>
      }),
      columnHelper.accessor('member_account_name', {
        header: 'Member Account Name',
        cell: ({ row }) => (
          <Typography
          >
            {row.original.member_account_name}

          </Typography>
        )
      }),
      columnHelper.accessor('currency_code', {
        header: 'Currency Code',
        cell: ({ row }) =>
          <Typography
          >
            {row.original.currency_code}

          </Typography>

      }),

      columnHelper.accessor('remarks', {
        header: 'Remarks',
        cell: ({ row }) => <Typography>{row.original.remarks}</Typography>
      }),



    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tableData]
  )

  const table = useReactTable({
    data: tableData as WithdrawalLogType[],
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
        <CardHeader title='API Withdrawal Log' className='pbe-4' />
        {/* Pass onManualSearch prop to TableFilters */}
        {/* <TableFilters filters={filters} onFilterChange={onFilterChange} onSearch={onManualSearch} /> */}
        <Divider />
        <div className='flex justify-between gap-4 p-5 flex-col items-start sm:flex-row sm:items-center'>
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
          rowsPerPageOptions={[10, 30, 50]}
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
    </>
  )
}

export default WithdrawalLogTable
