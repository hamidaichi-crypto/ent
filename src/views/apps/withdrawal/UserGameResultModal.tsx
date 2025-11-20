'use client'

// React Imports
import { useEffect, useState, Fragment, useCallback, useMemo } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import {
  Box,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead, Chip,
  CircularProgress
} from '@mui/material'

// Third-party Imports
import classnames from 'classnames'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues
} from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
// Third-party Imports
import { toast } from 'react-toastify'

// Type Imports
import type { WithdrawalType } from '@/types/apps/withdrawalTypes'

// Util Imports
import { formatDateTime } from '@/utils/dateFormatter'
import { useFetchData, usePostData } from '@/utils/api'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

type WithdrawalTypeWithAction = WithdrawalType & {
  action?: string
}

type GameReport = {
  [key: string]: any
}

type GameReportMetadata = {
  username: string
  user_id: number
  start_date: string
  end_date: string
}

type GameResult = {
  ticket_id: string
  ticket_time: string
  settlement_time: string
  sport_type: string
  competition_name: string
  event_id: string
  odds: string
  odds_type: string
  bet_amount: string
  w_l_amount: string
  w_l_status: string
  match_name: string
  bet_ip: string
  market: string
  choice: string
}

const formatCurrency = (amount: number | string | null | undefined, alignRight: boolean = true) => {
  if (amount === null || amount === undefined) {
    return <Typography variant="body2" sx={{ textAlign: alignRight ? 'right' : 'left', color: 'text.primary' }}>0.00</Typography>;
  }
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) {
    return <Typography variant="body2" sx={{ textAlign: alignRight ? 'right' : 'left', color: 'text.primary' }}>0.00</Typography>;
  }
  const color = num < 0 ? 'error.main' : 'text.primary';
  return <Typography variant="body2" sx={{ textAlign: alignRight ? 'right' : 'left', color: color }}>{num.toFixed(2)}</Typography>;
};

// --- User Withdrawal Modal Component ---
const UserGameResultModal = ({
  withdrawal,
  open,
  onClose,
  onReloadTable
}: {
  withdrawal: WithdrawalTypeWithAction | null
  open: boolean
  onClose: () => void
  onReloadTable: () => void
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gameReports, setGameReports] = useState<GameReport[]>([])
  const [metadata, setMetadata] = useState<GameReportMetadata | null>(null)
  const [gameResults, setGameResults] = useState<GameResult[]>([])
  const [gameResultsOpen, setGameResultsOpen] = useState(false)
  const [selectedGameProviderCode, setSelectedGameProviderCode] = useState<string | null>(null)
  const fetchData = useFetchData()

  const handleGameProviderCodeClick = (gameProviderCode: string) => {
    if (gameProviderCode !== '-' && gameProviderCode !== 'Summary') {
      setSelectedGameProviderCode(gameProviderCode)
      setGameResultsOpen(true)
    }
  }

  const handleGameResultsClose = () => {
    setGameResultsOpen(false)
    setSelectedGameProviderCode(null)
    setGameResults([])
  }

  const fetchGameResults = useCallback(async () => {
    if (gameResultsOpen && selectedGameProviderCode && metadata) {
      setLoading(true)
      setError(null)
      try {
        const url = `/members/game_results?username=${metadata.username}&user_id=${metadata.user_id}&start_date=${metadata.start_date}&end_date=${metadata.end_date}&game_provider_code=${selectedGameProviderCode}`
        const response = await fetchData(url)

        setGameResults(response.data?.rows || [])
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'An unknown error occurred')
      } finally {
        setLoading(false)
      }
    }
  }, [gameResultsOpen, selectedGameProviderCode, metadata, fetchData])

  useEffect(() => {
    const fetchGameReports = async () => {
      if (open && withdrawal) {
        setLoading(true)
        setError(null)
        try {
          const response = await fetchData(`/withdrawals/game_reports/${withdrawal.id}`)

          if (response.status === 1 && response.data) {
            setGameReports(response.data.rows || [])
            setMetadata(response.data.metadata || null)
          } else {
            setGameReports([])
            setMetadata(null)
            toast.error(response.message || 'Failed to fetch game reports.')
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'

          console.error('Failed to fetch game reports:', err)
          toast.error(errorMessage)
          setError(errorMessage)
          setGameReports([])
          setMetadata(null)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchGameReports()
  }, [open, withdrawal, fetchData])

  useEffect(() => {
    fetchGameResults()
  }, [fetchGameResults])

  const columnHelper = createColumnHelper<GameReport>()

  const columns = useMemo<ColumnDef<GameReport, any>[]>(() => [
    columnHelper.accessor('currency_code', { header: 'Currency', cell: ({ row }) => <Typography variant="body2" sx={{ textAlign: 'center' }}>{row.original.currency_code}</Typography>, size: 80 }),
    columnHelper.accessor('game_provider_code', {
      header: 'Game Provider',
      size: 120,
      cell: ({ row }) => {
        const providerCode = row.original.game_provider_code;
        if (providerCode !== '-' && providerCode !== 'Summary') {
          return (
            <Chip
              label={providerCode}
              color='primary'
              onClick={() => handleGameProviderCodeClick(providerCode)}
              className='cursor-pointer'
              sx={{ margin: 'auto', display: 'flex' }}
            />
          );
        }
        return <Typography variant="body2" sx={{ textAlign: 'center' }}>{providerCode}</Typography>;
      }
    }),
    columnHelper.accessor('username', { header: 'Username', cell: ({ row }) => <Typography variant="body2" sx={{ textAlign: 'center' }}>{row.original.username}</Typography>, size: 150 }),
    {
      header: 'Transfer',
      columns: [
        columnHelper.accessor('total_number_of_transfer_in', { header: 'Total In Count', cell: ({ row }) => <Typography variant="body2" sx={{ textAlign: 'right' }}>{row.original.total_number_of_transfer_in}</Typography>, size: 120 }),
        columnHelper.accessor('total_transfer_in_amount', { header: 'Total In Amount', cell: ({ row }) => formatCurrency(row.original.total_transfer_in_amount), size: 120 }),
        columnHelper.accessor('total_number_of_transfer_out', { header: 'Total Out Count', cell: ({ row }) => <Typography variant="body2" sx={{ textAlign: 'right' }}>{row.original.total_number_of_transfer_out}</Typography>, size: 120 }),
        columnHelper.accessor('total_transfer_out_amount', { header: 'Total Out Amount', cell: ({ row }) => formatCurrency(row.original.total_transfer_out_amount), size: 120 }),
      ]
    },
    {
      header: 'Deposit',
      columns: [
        columnHelper.accessor('total_number_of_deposit', { header: 'Total Deposit Count', cell: ({ row }) => <Typography variant="body2" sx={{ textAlign: 'right' }}>{row.original.total_number_of_deposit}</Typography>, size: 120 }),
        columnHelper.accessor('total_deposit', { header: 'Total Deposit Amount', cell: ({ row }) => formatCurrency(row.original.total_deposit), size: 120 }),
      ]
    },
    {
      header: 'Withdrawal',
      columns: [
        columnHelper.accessor('total_number_of_withdrawal', { header: 'Total Withdrawal Count', cell: ({ row }) => <Typography variant="body2" sx={{ textAlign: 'right' }}>{row.original.total_number_of_withdrawal}</Typography>, size: 120 }),
        columnHelper.accessor('total_withdrawal', { header: 'Total Withdrawal Amount', cell: ({ row }) => formatCurrency(row.original.total_withdrawal), size: 120 }),
      ]
    },
    {
      header: 'Company Processing Fee',
      columns: [
        columnHelper.accessor('total_cashout_fee', { header: 'Total Cash Out Fee', cell: ({ row }) => formatCurrency(row.original.total_cashout_fee), size: 120 }),
        columnHelper.accessor('total_deposit_processing_fee', { header: 'Total Deposit Processing Fee', cell: ({ row }) => formatCurrency(row.original.total_deposit_processing_fee), size: 150 }),
        columnHelper.accessor('total_withdrawal_processing_fee', { header: 'Total Withdrawal Processing Fee', cell: ({ row }) => formatCurrency(row.original.total_withdrawal_processing_fee), size: 150 }),
      ]
    },
    {
      header: 'Bets',
      columns: [
        columnHelper.accessor('total_bet_count', { header: 'Total Bet Count', cell: ({ row }) => <Typography variant="body2" sx={{ textAlign: 'right' }}>{row.original.total_bet_count}</Typography>, size: 120 }),
        columnHelper.accessor('total_bet_amount', { header: 'Total Bet Amount', cell: ({ row }) => formatCurrency(row.original.total_bet_amount), size: 120 }),
        columnHelper.accessor('total_valid_bet_amount', { header: 'Total Valid Bet Amount', cell: ({ row }) => formatCurrency(row.original.total_valid_bet_amount), size: 120 }),
        columnHelper.accessor('win_lose', { header: 'Player W/L', cell: ({ row }) => formatCurrency(row.original.win_lose), size: 120 }),
        columnHelper.accessor('total_jackpot_contribution', { header: 'Total Jackpot Contribution', cell: ({ row }) => formatCurrency(row.original.total_jackpot_contribution), size: 150 }),
        columnHelper.accessor('total_jackpot_win', { header: 'Total Jackpot Win', cell: ({ row }) => formatCurrency(row.original.total_jackpot_win), size: 120 }),
        columnHelper.accessor('nett_jackpot', { header: 'Nett Jackpot', cell: ({ row }) => formatCurrency(row.original.nett_jackpot), size: 120 }),
        columnHelper.accessor('game_bet_amount', { header: 'Game Bet Amount', cell: ({ row }) => formatCurrency(row.original.game_bet_amount), size: 120 }),
        columnHelper.accessor('gross_game_revenue', { header: 'Gross Game Revenue (GGR)', cell: ({ row }) => formatCurrency(row.original.gross_game_revenue), size: 150 }),
      ]
    }
  ], [handleGameProviderCodeClick]);

  const table = useReactTable({
    data: gameReports,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
  })

  const groupColors: { [key: string]: string } = {
    'Transfer': '#e0f2f7', // Light blue
    'Deposit': '#e8f5e9',  // Light green
    'Withdrawal': '#ffebee', // Light red
    'Company Processing Fee': '#fff3e0', // Light orange
    'Bets': '#f3e5f5', // Light purple
  };

  const groupTextColors: { [key: string]: string } = {
    'Transfer': '#01579b', // Darker blue
    'Deposit': '#2e7d32',  // Darker green
    'Withdrawal': '#c62828', // Darker red
    'Company Processing Fee': '#e65100', // Darker orange
    'Bets': '#6a1b9a', // Darker purple
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth='6xl'>
        <DialogTitle>Game Reports</DialogTitle>
        <IconButton onClick={onClose} className='absolute block-start-4 inline-end-4'>
          <i className='ri-close-line' />
        </IconButton>
        <DialogContent>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
              <CircularProgress />
            </Box>
          )}
          {error && <Typography color='error'>{error}</Typography>}
          {!loading && !error && (
            <Fragment>
              {metadata && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant='h6'>Report for: {metadata.username}</Typography>
                  <Typography variant='body2'>
                    Date Range: {metadata.start_date} to {metadata.end_date}
                  </Typography>
                </Box>
              )}
              <div className='overflow-x-auto'>
                <table className={tableStyles.table} style={{ tableLayout: 'fixed' }}>
                  <TableHead>
                    {table.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map(header => {
                          const columnSize = header.getSize();
                          const widthStyle = columnSize ? { width: columnSize, minWidth: columnSize } : undefined;

                          return (
                            <th
                              key={header.id}
                              colSpan={header.colSpan}
                              style={{
                                ...widthStyle,
                                textAlign: 'center',
                                verticalAlign: 'middle',
                                backgroundColor: (() => {
                                  if ('columns' in header.column.columnDef && header.column.columnDef.columns && typeof header.column.columnDef.header === 'string') {
                                    return groupColors[header.column.columnDef.header as string] || 'inherit';
                                  } else {
                                    const parentGroupHeader = header.column.parent?.columnDef?.header;
                                    if (typeof parentGroupHeader === 'string') {
                                      return groupColors[parentGroupHeader] || 'inherit';
                                    }
                                  }
                                  return 'inherit';
                                })(),
                                color: (() => {
                                  if ('columns' in header.column.columnDef && header.column.columnDef.columns && typeof header.column.columnDef.header === 'string') {
                                    return groupTextColors[header.column.columnDef.header as string] || 'inherit';
                                  } else {
                                    const parentGroupHeader = header.column.parent?.columnDef?.header;
                                    if (typeof parentGroupHeader === 'string') {
                                      return groupTextColors[parentGroupHeader] || 'inherit';
                                    }
                                  }
                                  return 'inherit';
                                })(),
                                borderRight: (() => {
                                  const parentGroupHeader = header.column.parent?.columnDef?.header;
                                  if ('columns' in header.column.columnDef && header.column.columnDef.columns && typeof header.column.columnDef.header === 'string') {
                                    return '2px solid #fff';
                                  } else if (typeof parentGroupHeader === 'string') {
                                    const groupColumns = header.column.parent?.columns || [];
                                    const isLastInGroup = groupColumns[groupColumns.length - 1].id === header.column.id;
                                    return isLastInGroup ? '2px solid #fff' : '1px solid rgba(0,0,0,0.1)';
                                  }
                                  return '1px solid rgba(0,0,0,0.1)';
                                })()
                              }}
                            >
                              {header.isPlaceholder ? null : (
                                <div
                                  className={classnames({
                                    'flex items-center justify-center gap-1': true,
                                    'cursor-pointer select-none': header.column.getCanSort(),
                                  })}
                                  onClick={header.column.getToggleSortingHandler()}
                                >
                                  <span style={{ whiteSpace: 'normal', lineHeight: '1.2' }}>
                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                  </span>
                                  {{
                                    asc: <i className='ri-arrow-up-s-line text-xl' />,
                                    desc: <i className='ri-arrow-down-s-line text-xl' />,
                                  }[header.column.getIsSorted() as 'asc' | 'desc'] ?? null}
                                </div>
                              )}
                            </th>
                          );
                        })}
                      </tr>
                    ))}
                  </TableHead>
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
                      {table.getRowModel().rows.map(row => (
                        <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                          {row.getVisibleCells().map(cell => {
                            const columnSize = cell.column.getSize();
                            const widthStyle = columnSize ? { width: columnSize, minWidth: columnSize } : undefined;
                            return (
                              <td key={cell.id} style={widthStyle}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  )}
                </table>
              </div>
            </Fragment>
          )}
        </DialogContent>
        <DialogActions></DialogActions>
      </Dialog>
      <Dialog open={gameResultsOpen} onClose={handleGameResultsClose} fullWidth maxWidth='xl'>
        <DialogTitle>Game Results for {selectedGameProviderCode}</DialogTitle>
        <IconButton onClick={handleGameResultsClose} className='absolute block-start-4 inline-end-4'>
          <i className='ri-close-line' />
        </IconButton>
        <DialogContent>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
              <CircularProgress />
            </Box>
          )}
          {error && <Typography color='error'>{error}</Typography>}
          {!loading && !error && (
            <div className='overflow-x-auto'>
              <Table>
                <TableHead>
                  <TableRow>
                    {gameResults.length > 0 &&
                      Object.keys(gameResults[0]).map(key => (
                        <TableCell key={key}>{key.replace(/_/g, ' ').toLocaleUpperCase()}</TableCell>
                      ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {gameResults.length > 0 ? (
                    gameResults.map((result, index) => (
                      <TableRow key={index}>
                        {Object.keys(result).map(key => {
                          const value = (result as any)[key]

                          if (key === 'ticket_time' || key === 'settlement_time') {
                            return <TableCell key={key}>{formatDateTime(value)}</TableCell>
                          }

                          return <TableCell key={key}>{value}</TableCell>
                        })}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={gameResults.length > 0 ? Object.keys(gameResults[0]).length : 1}
                        align='center'
                      >
                        No data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <button onClick={handleGameResultsClose}>Close</button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default UserGameResultModal
