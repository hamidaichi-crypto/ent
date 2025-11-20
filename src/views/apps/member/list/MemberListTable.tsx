'use client'

// React Imports
import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
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
import type { TextFieldProps } from '@mui/material/TextField'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import {
  Tabs,
  Tab,
  Box,
  Grid,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  TextField,
  TableHead
} from '@mui/material'

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
import type { ThemeColor } from '@core/types'
import type { MemberType } from '@/types/apps/memberTypes'
import type { Locale } from '@configs/i18n'

// Component Imports
import TableFilters from './TableFilters'
import AddUserDrawer from './AddUserDrawer'
import CustomAvatar from '@core/components/mui/Avatar'
import OptionMenu from '@core/components/option-menu'
import UserDetailModal from './UserDetailModal'

// Util Imports
import { getInitials } from '@/utils/getInitials'
import { getLocalizedUrl } from '@/utils/i18n'
import { formatDateTime } from '@/utils/dateFormatter'
import { useFetchData } from '@/utils/api' // Corrected import for the hook

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

type MembersTypeWithAction = MemberType & {
  action?: string
}

type UserRoleType = {
  [key: string]: { icon: string; color: string }
}

type UserStatusType = {
  [key: string]: ThemeColor
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

const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number
  onChange: (value: string | number) => void
  debounce?: number
} & Omit<TextFieldProps, 'onChange'>) => {
  // States
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} size='small' />
}

// Column Definitions
const columnHelper = createColumnHelper<MembersTypeWithAction>()

type PaginationData = {
  current_page: number
  last_page: number
  per_page: number
  total: number
}


const MemberListTable = ({
  tableData,
  paginationData,
  onPageChange,
  onRowsPerPageChange,
  filters,
  onFilterChange,
  onClear,
  onSearch // Receive onSearch prop
}: {
  tableData?: MemberType[]
  paginationData: PaginationData
  onPageChange: (page: number) => void
  onRowsPerPageChange: (perPage: number) => void
  filters: {
    username: string
    name: string
    mobile: string
    dateType: string
    startDate: string
    endDate: string
  }
  onFilterChange: (newFilters: {
    username: string
    name: string
    mobile: string
    dateType: string
    startDate: string
    endDate: string
  }) => void
  onClear: () => void
  onSearch: () => void // Add onSearch prop
}) => {
  // States
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [isUserDetailModalOpen, setIsUserDetailModalOpen] = useState(false)
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [selectedUser, setSelectedUser] = useState<MemberType | null>(null)

  // Hooks
  const { lang: locale } = useParams()

  const columns = useMemo<ColumnDef<MembersTypeWithAction, any>[]>(
    () => {
      const registrationDomainColumn = columnHelper.accessor('registration_site', {
        header: 'Registration Domain',
        cell: ({ row }) => <Typography sx={{ textAlign: 'center', whiteSpace: 'normal', wordBreak: 'break-word' }}>{row.original.registration_site}</Typography>,
        size: 350,
      });

      const registrationIpColumn = columnHelper.accessor('registration_ip', {
        header: 'Registration IP Address',
        cell: ({ row }) => <Typography sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{row.original.registration_ip}</Typography>,
        size: 300,
        meta: {
          pinned: 'right'
        }
      });

      const otherColumns = [
        columnHelper.accessor('action', {
          header: 'Action',
          cell: ({ row }) => (
            <div className='flex items-center gap-0.5'>
              <IconButton size='small' onClick={() => {
                setSelectedUsername(row.original.username)
                setSelectedUserId(row.original.id)
                setSelectedUser(row.original)
                setIsUserDetailModalOpen(true)
              }}>
                <i className='ri-eye-line text-textSecondary' />
              </IconButton>
            </div>
          ),
          enableSorting: false,
          size: 80,
          meta: {
            pinned: 'left'
          }
        }),
        columnHelper.accessor('id', {
          header: 'Member ID',
          cell: ({ row }) => <Typography>{row.original.id}</Typography>,
          size: 100
        }),
        columnHelper.accessor('username', {
          header: 'User Name',
          cell: ({ row }) => (
            <Typography
              className='cursor-pointer'
              sx={{ color: 'primary.main', '&:hover': { textDecoration: 'underline' }, textAlign: 'center' }}
              onClick={() => {
                setSelectedUsername(row.original.username)
                setSelectedUserId(row.original.id)
                setSelectedUser(row.original)
                setIsUserDetailModalOpen(true)
              }}
            >
              {row.original.username}
            </Typography>
          ),
          size: 150
        }),
        columnHelper.accessor('score', {
          header: 'Score',
          cell: ({ row }) => <Typography> - </Typography>,
          size: 80
        }),
        columnHelper.accessor('grade', {
          size: 80
        }),
        columnHelper.accessor('mobile', {
          header: 'Mobile No',
          cell: ({ row }) => <Typography>{row.original.mobile}</Typography>,
          size: 150
        }),
        columnHelper.accessor('member_group_id', {
          header: 'Member Group',
          cell: ({ row }) => <Typography>{row.original.member_group_id}</Typography>,
          size: 120
        }),
        columnHelper.accessor('status', {
          header: 'Status',
          cell: ({ row }) => <Typography>{row.original.status}</Typography>,
          size: 100
        }),
        columnHelper.accessor('referrer', {
          header: 'Refer By',
          cell: ({ row }) => <Typography>{row.original.referrer}</Typography>,
          size: 120
        }),
        columnHelper.accessor('remark', {
          header: 'Remark',
          cell: ({ row }) => <Typography> - </Typography>,
          size: 150
        }),
        columnHelper.accessor('registration_created_at', {
          header: 'Registration Date',
          cell: ({ row }) => <Typography sx={{ textAlign: 'center' }}>{formatDateTime(row.original.registration_created_at)}</Typography>,
          size: 200
        }),
      ];

      return [...otherColumns, registrationDomainColumn, registrationIpColumn];
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tableData, locale, isUserDetailModalOpen, selectedUsername, selectedUserId, selectedUser] // Added dependencies for modal state
  )

  const table = useReactTable({
    data: tableData as MemberType[],
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
        <CardHeader title='Member List' className='pbe-4' />
        <TableFilters filters={filters} onFilterChange={onFilterChange} onSearch={onSearch} onClear={onClear} />
        <Divider />
        {/* <div className='flex justify-between gap-4 p-5 flex-col items-start sm:row-start-center'>
                    <Button
                        color='secondary'
                        variant='outlined'
                        startIcon={<i className='ri-upload-2-line' />}
                        className='max-sm:is-full'
                    >
                        Export
                    </Button>
                    <div className='flex items-center gap-x-4 max-sm:gap-y-4 flex-col max-sm:is-full sm:flex-row'>
                        <DebouncedInput
                            value={globalFilter ?? ''}
                            onChange={value => setGlobalFilter(String(value))}
                            placeholder='Search User'
                            className='max-sm:is-full'
                        />
                        <Button variant='contained' onClick={() => setAddUserOpen(!addUserOpen)} className='max-sm:is-full'>
                            Add New User
                        </Button>
                    </div>
                </div> */}
        <div className='overflow-x-auto'>
          <table className={tableStyles.table} style={{ tableLayout: 'fixed' }}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} style={{ textAlign: 'center', width: header.getSize() }}>
                      {header.isPlaceholder ? null : (
                        <>
                          <div
                            className={classnames({
                              'flex items-center justify-center': header.column.getIsSorted(),
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
                          <td key={cell.id} style={{ width: cell.column.getSize() }}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
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
      <UserDetailModal
        username={selectedUsername}
        userId={selectedUserId}
        user={selectedUser}
        open={isUserDetailModalOpen}
        onClose={() => {
          setIsUserDetailModalOpen(false)
          setSelectedUsername(null)
          setSelectedUserId(null)
          setSelectedUser(null)
        }}
      />
    </>
  )
}

export default MemberListTable
