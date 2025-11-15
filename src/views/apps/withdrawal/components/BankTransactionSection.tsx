'use client'

// MUI Imports
import {
  Box,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  FormControl,
  Select,
  MenuItem,
  TextField,
  CircularProgress
} from '@mui/material'
import FormHelperText from '@mui/material/FormHelperText'

// Third-party Imports
import { Controller } from 'react-hook-form'

// Type Imports
import type { WithdrawalType, BankTransaction } from '@/types/apps/withdrawalTypes'

type Props = {
  withdrawal: WithdrawalType
  bankTransactions: BankTransaction[]
  isSubmitting: boolean
  transactionRow: any
  handleAddTransaction: () => void
  handleSubmit: (onSubmit: any) => (e?: React.BaseSyntheticEvent) => Promise<void>
  onApproveSubmit: (data: any) => Promise<void>
  control: any
  errors: any
  bankList: { id: number; name: string }[]
  handleRemove: () => void
}

const BankTransactionSection = (props: Props) => {
  const {
    withdrawal,
    bankTransactions,
    isSubmitting,
    transactionRow,
    handleAddTransaction,
    handleSubmit,
    onApproveSubmit,
    control,
    errors,
    bankList,
    handleRemove
  } = props

  return (
    <Box border={1} borderRadius={2} p={2} mt={3}>
      <h4>Bank Transaction</h4>

      {withdrawal.status === 0 && (
        <Button
          variant='contained'
          color='primary'
          disabled={!!transactionRow}
          onClick={handleAddTransaction}
          sx={{ mb: 2 }}
        >
          Add Transaction
        </Button>
      )}

      {transactionRow && (
        <form onSubmit={handleSubmit(onApproveSubmit)}>
          <Box display='flex' gap={2} alignItems='flex-start' mb={2}>
            <FormControl fullWidth error={!!errors.merchant_bank_id} sx={{ width: '250px' }}>
              <Controller
                name='merchant_bank_id'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select {...field} displayEmpty sx={{ minWidth: 50 }} value={field.value || ''}>
                    <MenuItem value=''>Please Select</MenuItem>
                    {bankList.map(bank => (
                      <MenuItem key={bank.id} value={bank.id}>
                        {bank.name}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
              {errors.merchant_bank_id && <FormHelperText error>Please select a bank.</FormHelperText>}
            </FormControl>

            <Controller
              name='amount'
              control={control}
              defaultValue={parseFloat(withdrawal?.confirmed_amount || '0') || null}
              rules={{ required: true, min: 0.01 }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label='Amount'
                  {...(errors.amount
                    ? {
                      error: true,
                      helperText:
                        errors.amount.type === 'min' ? 'Amount must be greater than 0.' : 'This field is required.'
                    }
                    : {})}
                />
              )}
            />

            <Controller name='remark' control={control} render={({ field }) => <TextField {...field} label='Remark' />} />

            <Button variant='contained' color='success' type='submit' disabled={isSubmitting}>
              {isSubmitting ? <CircularProgress size={24} color='inherit' /> : 'Approve'}
            </Button>
            <Button variant='contained' color='warning' onClick={handleRemove} disabled={isSubmitting}>
              Remove
            </Button>
          </Box>
        </form>
      )}

      <Table size='small'>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Bank</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Processing Fee</TableCell>
            <TableCell>Confirmed Amount</TableCell>
            <TableCell>Receipt</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>References</TableCell>
            <TableCell>Remarks</TableCell>
            <TableCell>Created By</TableCell>
            <TableCell>Updated By</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isSubmitting && bankTransactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={12} align='center'>
                <CircularProgress />
              </TableCell>
            </TableRow>
          ) : bankTransactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={12} align='center'>
                No data available
              </TableCell>
            </TableRow>
          ) : (
            bankTransactions.map(t => (
              <TableRow key={t.id}>
                <TableCell>{t.id}</TableCell>
                <TableCell>{t.merchant_bank}</TableCell>
                <TableCell>{parseFloat(t.amount).toFixed(2)}</TableCell>
                <TableCell>
                  <Box display='flex' flexDirection='column'>
                    <Box display='flex' justifyContent='space-between'>
                      <strong>Player:</strong>
                      <span>{parseFloat(t.member_processing_fee).toFixed(2)}</span>
                    </Box>
                    <Box display='flex' justifyContent='space-between'>
                      <span>Company:</span>
                      <span>{parseFloat(t.processing_fee).toFixed(2)}</span>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{withdrawal.confirmed_amount}</TableCell>
                <TableCell>-</TableCell>
                <TableCell>{t.status_name}</TableCell>
                <TableCell>{t.pg_reference_id}</TableCell>
                <TableCell>{t.transaction_remarks}</TableCell>
                <TableCell>{t.created_by}</TableCell>
                <TableCell>{t.updated_by || '-'}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Box>
  )
}

export default BankTransactionSection
