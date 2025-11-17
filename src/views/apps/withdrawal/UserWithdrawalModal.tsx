'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
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
  TableHead,
  Select,
  MenuItem,
  FormControl,
  CircularProgress
} from '@mui/material'
import FormHelperText from '@mui/material/FormHelperText'

// Third-party Imports
import { toast } from 'react-toastify'
import { useForm, Controller } from 'react-hook-form'

// Type Imports
import type { WithdrawalType, BankTransaction, PgLog } from '@/types/apps/withdrawalTypes'

// Util Imports
import { formatDateTime } from '@/utils/dateFormatter'
import { useFetchData, usePostData } from '@/utils/api'

// Component Imports
import TransactionInfo from './components/TransactionInfo'
import PgCallbackLog from './components/PgCallbackLog'
import BankTransactionSection from './components/BankTransactionSection'

type WithdrawalTypeWithAction = WithdrawalType & {
  action?: string
}

type FormDataType = {
  withdraw_id: number | null
  amount: number | null
  member_account_id: number | null
  bank_account_id: string | null
  merchant_bank_id: number | null
  remark: string
}

const getAccountNumber = (accountInfo: string | undefined) => {
  if (!accountInfo) {
    return ''
  }
  const parts = accountInfo.split(' - ')

  return parts[parts.length - 1].trim()
}

// --- User Withdrawal Modal Component ---
const UserWithdrawalModal = ({
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bankList, setBankList] = useState<{ id: number; name: string }[]>([])

  const [pgLogs, setPgLogs] = useState<PgLog[]>([])
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([])
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormDataType>({
    defaultValues: {
      withdraw_id: null,
      amount: null,
      member_account_id: null,
      bank_account_id: null,
      merchant_bank_id: null,
      remark: ''
    }
  })
  const [transactionRow, setTransactionRow] = useState<any>(null)
  const [transactions, setTransactions] = useState<BankTransaction[]>([])

  const postData = usePostData()
  const fetchData = useFetchData()

  const loadBankList = async () => {
    try {
      const response = await fetchData('/system/withdrawal_banks')

      if (response && response.data) {
        setBankList(response.data?.banks)
      } else {
        setBankList([])
      }
    } catch (err) {
      console.error('Error fetching bank list:', err)
      setError('Failed to load bank list.')
    }
  }

  const handleAddTransaction = () => {
    setTransactionRow({})
    reset({
      amount: withdrawal?.confirmed_amount ? parseFloat(withdrawal.confirmed_amount) : null
    })
  }

  const onApproveSubmit = async (data: any) => {
    const selectedBank = bankList.find(bank => bank.id === data.merchant_bank_id)
    const newTransaction = {
      ...data,
      merchant_bank_account: selectedBank ? selectedBank.name : ''
    }
    const body = {
      withdraw_id: withdrawal?.id,
      amount: parseFloat(newTransaction.amount),
      member_account_id: withdrawal?.member_id,
      bank_account_id: getAccountNumber(withdrawal?.member_bank_account),
      merchant_bank_id: selectedBank?.id,
      remarks: newTransaction.remark || null
    }

    try {
      setIsSubmitting(true)
      const responseData = await postData(`/withdrawals/approve`, body)

      if (responseData.status === -1) {
        let errorMessage = responseData.message

        try {
          const parsedMessage = JSON.parse(errorMessage)

          if (Array.isArray(parsedMessage)) {
            errorMessage = parsedMessage.join('\n')
          }
        } catch (e) {
          // It's not a JSON string, so we'll use the message as is.
        }
        toast.error(errorMessage, { position: 'top-center' })
      } else {
        toast.success('Withdrawal approved successfully.', { position: 'top-center' })
        onClose()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      toast.error(err instanceof Error ? err.message : 'An unknown error occurred', { position: 'top-center' })
    } finally {
      setIsSubmitting(false)
      onReloadTable()
    }
  }

  const handleRemove = () => {
    setTransactionRow(null)
    reset()
  }

  useEffect(() => {
    if (!open) {
      setError(null)
      setIsSubmitting(false)
    }

    if (open && withdrawal?.bank_transactions) {
      setTransactions(withdrawal.bank_transactions)
    }

    if (open) {
      loadBankList()
      setTransactionRow(null)

      const fetchDetails = async () => {
        if (withdrawal && (withdrawal.status === 1 || withdrawal.status === 2)) {
          try {
            setIsSubmitting(true)
            const response = await fetchData(`/withdrawals/details/${withdrawal.id}`)

            if (response.status === 1 && response.data?.withdrawal) {
              setPgLogs(response.data.withdrawal.pg_logs || [])
              setBankTransactions(response.data.withdrawal.bank_transactions || [])
            } else {
              setPgLogs([])
              setBankTransactions([])
            }
          } catch (err) {
            console.error('Failed to fetch withdrawal details:', err)
            setPgLogs([])
            setBankTransactions([])
          } finally {
            setIsSubmitting(false)
          }
        } else {
          setPgLogs([])
          setBankTransactions([])
        }
      }

      fetchDetails()
    }
  }, [open, withdrawal, fetchData])

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [rejectionRemark, setRejectionRemark] = useState('')

  const handleReject = async () => {
    if (!withdrawal) {
      setError('Withdrawal data is not available.')

      return
    }

    try {
      setIsSubmitting(true)
      const body = {
        withdraw_id: withdrawal.id,
        remarks: rejectionRemark || 'Rejected by user'
      }
      const responseData = await postData(`/withdrawals/reject`, body)

      if (responseData.status === -1) {
        let errorMessage = responseData.message

        try {
          const parsedMessage = JSON.parse(errorMessage)

          if (Array.isArray(parsedMessage)) {
            errorMessage = parsedMessage.join('\n')
          }
        } catch (e) {
          // It's not a JSON string, so we'll use the message as is.
        }
        toast.error(errorMessage, { position: 'top-center' })
      } else {
        toast.success('Withdrawal rejected successfully.', { position: 'top-center' })
        setConfirmOpen(false)
        onClose()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      toast.error(err instanceof Error ? err.message : 'An unknown error occurred', { position: 'top-center' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth='xl'>
        <DialogTitle>Withdrawal Details</DialogTitle>
        <IconButton onClick={onClose} className='absolute block-start-4 inline-end-4'>
          <i className='ri-close-line' />
        </IconButton>
        {withdrawal && (
          <>
            <DialogContent>
              {/* Tabs */}
              <Tabs value={0}>
                <Tab label='Withdrawal Info' />
              </Tabs>

              {/* Member & Bank Info */}
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                  <Box border={1} borderRadius={2} p={2}>
                    <h4>Member Info</h4>
                    <Table size='small'>
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
                    <Table size='small'>
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
              <TransactionInfo withdrawal={withdrawal} />

              {/* --- Payment gateway callback log Section --- */}
              {(withdrawal.status === 1 || withdrawal.status === 2) && (
                <PgCallbackLog pgLogs={pgLogs} isSubmitting={isSubmitting} />
              )}

              {/* --- Bank Transaction Section --- */}
              <BankTransactionSection
                withdrawal={withdrawal}
                bankTransactions={bankTransactions}
                isSubmitting={isSubmitting}
                transactionRow={transactionRow}
                handleAddTransaction={handleAddTransaction}
                handleSubmit={handleSubmit}
                onApproveSubmit={onApproveSubmit}
                control={control}
                errors={errors}
                bankList={bankList}
                handleRemove={handleRemove}
              />

              <Box border={1} borderRadius={2} p={2} mt={3}>
                <h4>Past Transactions</h4>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Refer ID</TableCell>
                      <TableCell>Transaction Type</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>References</TableCell>
                      <TableCell>Remarks</TableCell>
                      <TableCell>Created By</TableCell>
                      <TableCell>Updated By</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={8} align='center'>
                        No data available
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            </DialogContent>

            {withdrawal.status == 0 && (
              <DialogActions sx={{ justifyContent: 'flex-start', p: 2 }}>
                <Button variant='contained' color='error' onClick={() => setConfirmOpen(true)} disabled={isSubmitting}>
                  Reject
                </Button>
              </DialogActions>
            )}
          </>
        )}
      </Dialog>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Rejection</DialogTitle>
        <DialogContent>
          Are you sure you want to reject this withdrawal?
          <TextField
            autoFocus
            margin='dense'
            id='rejection-remark'
            label='Rejection Remark'
            type='text'
            fullWidth
            variant='standard'
            value={rejectionRemark}
            onChange={e => setRejectionRemark(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant='contained' color='error' onClick={handleReject} disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={24} color='inherit' /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default UserWithdrawalModal
