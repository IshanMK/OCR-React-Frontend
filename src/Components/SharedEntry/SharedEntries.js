import React, {useEffect, useState } from 'react';
import {Badge, Chip, LinearProgress, Menu, MenuItem, Paper, Stack, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography} from '@mui/material';
import {IconButton} from '@mui/material';
import {CheckCircle, Circle, FilterList, Notifications} from '@mui/icons-material';
import {useNavigate } from 'react-router-dom';
import NotificationBar from '../NotificationBar';
import axios from 'axios';
import { useSelector} from 'react-redux';
import dayjs from 'dayjs';
import { LoadingButton } from '@mui/lab';

const filtOptions = ["All","Not Reviewed","Reviewed"]

const SharedEntries = () => {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [filt, setFilt] = React.useState("All");
    const open = Boolean(anchorEl);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [status, setStatus] = useState({msg:"",severity:"success", open:false});
    const userData = useSelector(state => state.data);
    const [page, setPage] = useState(1);
    const [noMore, setNoMore] = useState(false);
    const [newEntries, setNewEntries] = useState(0);
    const navigate = useNavigate();

    
    const handleOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleFilter = (name)=>{
        setPage(1);
        setFilt(name);
        handleClose();
    }

    const handleClick = (id) => {
        navigate(`/manage/shared/entries/${id}`)
    };

    const showMsg = (msg, severity)=>{
        setStatus({msg, severity, open:true})
    }

    useEffect(() => {
        getData();
    }, [filt]);

    const loadMore = () => {
        setLoading(true);
        setNoMore(false);
        axios.get(`${process.env.REACT_APP_BE_URL}/user/entry/shared/all`,{
            params: { page: page + 1, filter: filt},
            headers: {
                'Authorization': `Bearer ${userData.accessToken.token}`,
                'email': JSON.parse(sessionStorage.getItem("info")).email,
            },
            withCredentials: true
        }).then(res=>{
            if(res.data?.length < 20) setNoMore(true);
            setData([...data, ...res.data]);
            setPage(page+1);
        }).catch(err=>{
            if(err.response) showMsg(err.response.data?.message, "error")
            else alert(err?.message)
        }).finally(()=>{
            setLoading(false);
        })
    };

    const getData = ()=>{
        setLoading(true);
        setNoMore(false);
        axios.get(`${process.env.REACT_APP_BE_URL}/user/entry/shared/all`,{
            params: { page: 1, filter: filt},
            headers: {
                'Authorization': `Bearer ${userData.accessToken.token}`,
                'email': JSON.parse(sessionStorage.getItem("info")).email,
            },
            withCredentials: true
        }).then(res=>{
            if(res.data?.length < 20) setNoMore(true);
            setData(res.data);
        }).catch(err=>{
            if(err.response) showMsg(err.response.data?.message,"error")
            else alert(err?.message)
        }).finally(()=>{
            setLoading(false);
        })
    }  
    
    useEffect(()=>{
        axios.get(`${process.env.REACT_APP_BE_URL}/user/entry/count/newentries`,{
            headers: {
                'Authorization': `Bearer ${userData.accessToken.token}`,
                'email': JSON.parse(sessionStorage.getItem("info")).email,
            },
            withCredentials: true
        }).then(res=>{
            setNewEntries(res.data.count);
        }).catch(err=>{
            if(err.response) showMsg(err.response.data?.message, "error")
            else alert(err)
        })
    },[])


    return (
        <div className="inner_content">
        <div>
        <div className="sticky">
            <Typography sx={{ fontWeight: 700}} variant="h5">Assigend Entries</Typography> 
        </div>                
                <Paper sx={{p:2, my:3}}>
                <Stack direction='row' alignItems='center' spacing={1} mb={2}>
                    <IconButton
                        id="fade-button"
                        aria-controls={open ? 'fade-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={open ? 'true' : undefined}
                        onClick={handleOpen}
                    ><FilterList/></IconButton>
                    <Typography variant='body2' color='GrayText'>{filt}</Typography>
                    <div style={{flex:1}}></div>
                    <IconButton size='small' onClick={()=>handleFilter("Not Reviewed")}>
                        <Badge badgeContent={newEntries} max={99} color='error'>
                            <Notifications/>
                        </Badge>
                    </IconButton>
                </Stack>

                <Menu id="fade-menu" MenuListProps={{ 'aria-labelledby': 'fade-button'}} anchorEl={anchorEl} open={open} onClose={handleClose}>
                {filtOptions.map((item,index)=>{ return(<MenuItem key={index} onClick={()=>handleFilter(item)}>{item}</MenuItem>)})}
                </Menu>

                <TableContainer sx={{border: '1px solid lightgray', borderRadius: 1}}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell></TableCell>
                            <TableCell>Patient ID</TableCell>
                            <TableCell>Patient Name</TableCell>
                            <TableCell>Assigned Date</TableCell>
                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }}}>Created by</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                    {
                        loading && 
                        <TableRow >
                            <TableCell sx={{p:0}} colSpan={6}><LinearProgress/></TableCell>
                        </TableRow>
                    }
                    {data.map((item,index)=>{ 
                        return(
                        <TableRow key={index} sx={{cursor:'pointer', '&:hover':{background: '#f8f8f8'}}} onClick={()=>handleClick(item._id)}>
                            <TableCell>
                            <Stack direction='row' alignItems='center' spacing={1}>
                                {!item.reviewed? <Circle fontSize='small' className="text-danger-glow blink" color='error'/>:<CheckCircle fontSize='small' color='success'/>}
                                {!item.checked && <Chip size='small' label="New" />}
                            </Stack>
                            </TableCell>
                            <TableCell>{item.telecon_entry?.patient?.patient_id}</TableCell>
                            <TableCell>{item.telecon_entry?.patient?.patient_name}</TableCell>
                            <TableCell>{dayjs( new Date(item.createdAt)).format('DD/MM/YYYY')}</TableCell>
                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }}}>{item.telecon_entry?.clinician_id?.username}</TableCell>
                        </TableRow>
                    )})}
                    </TableBody>
                </Table>
                </TableContainer>
                <Stack direction='row' justifyContent='center'>
                    { data.length > 0 ?
                    <LoadingButton disabled={noMore} loading={loading} sx={{mt:2}} onClick={loadMore}>Load More</LoadingButton>
                    :
                    <Typography sx={{m:3}} variant='body2' color='GrayText'>{loading?"":"No Entries"}</Typography>
                    }
                </Stack>
                </Paper>
                <NotificationBar status={status} setStatus={setStatus}/>  
        </div>
    </div> 
    );
};

export default SharedEntries;