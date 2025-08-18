// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import type { ButtonProps } from '@mui/material/Button'

// Component Imports
import AddNewWithdrawal from '@components/dialogs/add-edit-withdrawal'
import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick'

const DialogAddNewAddress = () => {
    // Vars
    const buttonProps: ButtonProps = {
        variant: 'contained',
        children: 'Create'
    }

    return (
        <OpenDialogOnElementClick element={Button} elementProps={buttonProps} dialog={AddNewWithdrawal} />
    )
}

export default DialogAddNewAddress
