'use client'

// MUI Imports
import Badge from '@mui/material/Badge'
import IconButton from '@mui/material/IconButton'

const UploadIcon = () => {
    const handleClick = () => {
        console.log('Upload clicked')
        // add your upload logic here
    }

    return (
        <IconButton onClick={handleClick} className='text-textPrimary'>
            <Badge
                badgeContent={4}
                color='primary'
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                sx={{
                    '& .MuiBadge-badge': {
                        minWidth: '16px',
                        height: '16px',
                        fontSize: '0.625rem'
                    }
                }}
            >
                <i className='ri-download-2-line' />
            </Badge>
        </IconButton>
    )
}

export default UploadIcon
