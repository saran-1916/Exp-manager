import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import BackupOutlinedIcon from '@mui/icons-material/BackupOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import CloudSyncOutlinedIcon from '@mui/icons-material/CloudSyncOutlined';
import CurrencyRupeeOutlinedIcon from '@mui/icons-material/CurrencyRupeeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import { supabase } from '../../services/supabaseClient';

const APP_VERSION = '0.1.0';
const ACCENT = '#0077FF';
const BORDER = '#F0F0F0';
const MUTED = '#71717A';

const cardSx = {
  border: `1px solid ${BORDER}`,
  borderRadius: '24px',
  backgroundColor: '#FFFFFF',
  boxShadow: '0 18px 44px rgba(15, 23, 42, 0.04)',
  maxWidth: '100%',
  overflow: 'hidden',
  transition: 'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    borderColor: '#DADDE4',
    boxShadow: '0 22px 58px rgba(15, 23, 42, 0.06)'
  }
};

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '14px',
    backgroundColor: '#FFFFFF',
    fontWeight: 800,
    '& fieldset': { borderColor: BORDER },
    '&:hover fieldset': { borderColor: '#DADDE4' },
    '&.Mui-focused fieldset': { borderColor: '#111111', borderWidth: '1px' }
  },
  '& .MuiInputLabel-root': {
    color: '#888888',
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase'
  }
};

const sectionLabelSx = {
  color: MUTED,
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: '0.22em',
  maxWidth: '100%',
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap'
};

const sectionTitleSx = {
  color: '#000000',
  fontSize: { xs: 20, md: 24 },
  fontWeight: 900,
  letterSpacing: '-0.02em',
  overflowWrap: 'anywhere'
};

const truncateTextSx = {
  maxWidth: '100%',
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
};

const responsiveButtonTextSx = {
  '& .MuiButton-startIcon': {
    flexShrink: 0
  },
  '& .MuiButton-endIcon': {
    flexShrink: 0
  },
  '& .MuiButton-icon': {
    flexShrink: 0
  }
};

const iconBoxSx = {
  alignItems: 'center',
  backgroundColor: '#EAF4FF',
  borderRadius: '14px',
  color: ACCENT,
  display: 'grid',
  flexShrink: 0,
  height: 44,
  justifyContent: 'center',
  width: 44
};

const getDisplayName = (user) => (
  user?.user_metadata?.full_name ||
  user?.user_metadata?.name ||
  user?.email?.split('@')[0] ||
  ''
);

const makeFormatter = (formatMode, currencySymbol) => {
  const locale = formatMode === 'international' ? 'en-US' : 'en-IN';
  const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const prefix = currencySymbol === '₹' ? '₹' : `${currencySymbol} `;
  return (value) => `${prefix}${formatter.format(Number(value || 0))}`;
};

const escapeCsv = (value) => {
  const clean = String(value ?? '').replaceAll('"', '""');
  return `"${clean}"`;
};

const REMINDER_DAYS = [
  { key: 'mon', label: 'Mon', full: 'Monday' },
  { key: 'tue', label: 'Tue', full: 'Tuesday' },
  { key: 'wed', label: 'Wed', full: 'Wednesday' },
  { key: 'thu', label: 'Thu', full: 'Thursday' },
  { key: 'fri', label: 'Fri', full: 'Friday' },
  { key: 'sat', label: 'Sat', full: 'Saturday' },
  { key: 'sun', label: 'Sun', full: 'Sunday' }
];

const parseReminderTime = (value = '20:00') => {
  const [hours, minutes] = value.split(':').map(Number);
  const date = new Date();
  date.setHours(Number.isFinite(hours) ? hours : 20, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return date;
};

const serializeReminderTime = (value) => format(value || parseReminderTime(), 'HH:mm');

const makeReminderPreview = (settings) => {
  const timeLabel = format(settings.time || parseReminderTime(), 'h:mm a');

  if (!settings.enabled) return 'Expense reminders are currently off.';
  if (settings.frequency === 'daily') return `You will be reminded every day at ${timeLabel}`;
  if (settings.frequency === 'interval') {
    const days = Math.max(Number(settings.intervalDays || 1), 1);
    return `You will be reminded every ${days} ${days === 1 ? 'day' : 'days'} at ${timeLabel}`;
  }

  const selectedDays = REMINDER_DAYS
    .filter((day) => settings.customDays.includes(day.key))
    .map((day) => day.full);

  if (selectedDays.length === 0) return `Select at least one day for a weekly reminder at ${timeLabel}`;
  return `You will be reminded every ${selectedDays.join(', ')} at ${timeLabel}`;
};

const InfoRow = ({ label, value, dark = false }) => (
  <Box sx={{ minWidth: 0 }}>
    <Typography sx={{ ...truncateTextSx, color: dark ? '#A1A1AA' : '#888888', fontSize: 10, fontWeight: 900, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
      {label}
    </Typography>
    <Typography sx={{ mt: 0.75, color: dark ? '#FFFFFF' : '#111111', fontSize: 13, fontWeight: 800, wordBreak: 'break-word' }}>
      {value || 'Not available'}
    </Typography>
  </Box>
);

const StatTile = ({ icon, label, value }) => (
  <Box sx={{ border: `1px solid ${BORDER}`, borderRadius: '18px', maxWidth: '100%', minWidth: 0, overflow: 'hidden', p: 2.25 }}>
    <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0 }}>
      <Box sx={{ color: ACCENT, display: 'grid', flexShrink: 0 }}>{icon}</Box>
      <Typography sx={{ ...truncateTextSx, color: MUTED, fontSize: 10, fontWeight: 900, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
        {label}
      </Typography>
    </Stack>
    <Typography sx={{ mt: 1.5, color: '#000000', fontSize: { xs: 22, md: 26 }, fontWeight: 900, letterSpacing: '-0.03em', overflowWrap: 'anywhere' }}>
      {value}
    </Typography>
  </Box>
);

const SettingRow = ({ icon, title, subtitle, control }) => (
  <Stack
    direction="row"
    alignItems="center"
    justifyContent="space-between"
    spacing={{ xs: 0.75, sm: 2 }}
    sx={{
      border: `1px solid ${BORDER}`,
      borderRadius: '16px',
      flexWrap: 'nowrap',
      maxWidth: '100%',
      minWidth: 0,
      overflow: 'hidden',
      p: { xs: 1.25, sm: 2 }
    }}
  >
    <Stack direction="row" alignItems="center" spacing={{ xs: 0.75, sm: 1.25 }} sx={{ flex: '1 1 0%', maxWidth: '100%', minWidth: 0, overflow: 'hidden' }}>
      <Box sx={{ color: ACCENT, display: 'grid', flexShrink: 0 }}>{icon}</Box>
      <Box sx={{ flex: '1 1 0%', minWidth: 0, overflow: 'hidden' }}>
        <Typography sx={{ ...truncateTextSx, color: '#111111', fontSize: { xs: 13, sm: 14 }, fontWeight: 900 }}>{title}</Typography>
        <Typography sx={{ ...truncateTextSx, color: MUTED, fontSize: { xs: 11, sm: 12 }, fontWeight: 600 }}>{subtitle}</Typography>
      </Box>
    </Stack>
    <Box sx={{ alignItems: 'center', display: 'flex', flex: '0 0 auto', justifyContent: 'flex-end', maxWidth: { xs: '40%', sm: '48%' }, minWidth: 0, overflow: 'hidden' }}>
      {control}
    </Box>
  </Stack>
);

const ExpenseReminderCard = ({ reminderSettings, setReminderSettings, onSave, saving }) => {
  const previewText = makeReminderPreview(reminderSettings);

  const updateReminder = (patch) => {
    setReminderSettings((prev) => ({ ...prev, ...patch }));
  };

  const toggleDay = (dayKey) => {
    setReminderSettings((prev) => ({
      ...prev,
      customDays: prev.customDays.includes(dayKey)
        ? prev.customDays.filter((day) => day !== dayKey)
        : [...prev.customDays, dayKey]
    }));
  };

  return (
    <Card sx={cardSx}>
      <CardContent sx={{ p: { xs: 3, md: 4 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Box>
            <Typography sx={sectionLabelSx}>Expense reminder</Typography>
            <Typography sx={sectionTitleSx}>Notification schedule</Typography>
          </Box>
          <Box sx={iconBoxSx}><NotificationsActiveOutlinedIcon /></Box>
        </Stack>

        <Stack spacing={2.5}>
          <SettingRow
            icon={<NotificationsActiveOutlinedIcon fontSize="small" />}
            title="Enable Expense Reminder"
            subtitle={reminderSettings.enabled ? 'Reminder schedule is active' : 'Reminder schedule is paused'}
            control={
              <Switch
                checked={reminderSettings.enabled}
                onChange={(event) => updateReminder({ enabled: event.target.checked })}
              />
            }
          />

          <Collapse in={reminderSettings.enabled} timeout={260} unmountOnExit>
            <Stack spacing={2.5}>
              <Box sx={{ border: `1px solid ${BORDER}`, borderRadius: '18px', p: 2.25 }}>
                <Typography sx={{ color: '#888888', fontSize: 10, fontWeight: 900, letterSpacing: '0.16em', mb: 1.5, textTransform: 'uppercase' }}>
                  Frequency options
                </Typography>
                <RadioGroup
                  value={reminderSettings.frequency}
                  onChange={(event) => updateReminder({ frequency: event.target.value })}
                >
                  <FormControlLabel value="daily" control={<Radio />} label="Daily" />
                  <FormControlLabel value="interval" control={<Radio />} label="Every X Days" />
                  <FormControlLabel value="custom" control={<Radio />} label="Custom Days (Weekly)" />
                </RadioGroup>
              </Box>

              <Collapse in={reminderSettings.frequency === 'interval'} timeout={220} unmountOnExit>
                <TextField
                  label="Every"
                  type="number"
                  value={reminderSettings.intervalDays}
                  onChange={(event) => updateReminder({ intervalDays: Math.max(Number(event.target.value || 1), 1) })}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">days</InputAdornment>,
                    inputProps: { min: 1 }
                  }}
                  sx={fieldSx}
                />
              </Collapse>

              <Collapse in={reminderSettings.frequency === 'custom'} timeout={220} unmountOnExit>
                <Box sx={{ border: `1px solid ${BORDER}`, borderRadius: '18px', p: 2.25 }}>
                  <Typography sx={{ color: '#888888', fontSize: 10, fontWeight: 900, letterSpacing: '0.16em', mb: 1.5, textTransform: 'uppercase' }}>
                    Custom days
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {REMINDER_DAYS.map((day) => {
                      const selected = reminderSettings.customDays.includes(day.key);
                      return (
                        <Chip
                          key={day.key}
                          label={day.label}
                          clickable
                          onClick={() => toggleDay(day.key)}
                          sx={{
                            bgcolor: selected ? '#111111' : '#FFFFFF',
                            border: `1px solid ${selected ? '#111111' : BORDER}`,
                            color: selected ? '#FFFFFF' : '#111111',
                            fontWeight: 900,
                            minWidth: 54,
                            '&:hover': {
                              bgcolor: selected ? '#111111' : '#FAFAFA'
                            }
                          }}
                        />
                      );
                    })}
                  </Stack>
                </Box>
              </Collapse>

              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <TimePicker
                  label="Reminder time"
                  value={reminderSettings.time}
                  onChange={(newValue) => {
                    if (newValue) updateReminder({ time: newValue });
                  }}
                  slotProps={{ textField: { sx: fieldSx, fullWidth: true } }}
                />
              </LocalizationProvider>

              <Box sx={{ bgcolor: '#F8FAFC', border: `1px solid ${BORDER}`, borderRadius: '18px', p: 2.25 }}>
                <Typography sx={{ color: '#888888', fontSize: 10, fontWeight: 900, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
                  Preview
                </Typography>
                <Typography sx={{ color: '#111111', fontSize: 14, fontWeight: 900, lineHeight: 1.6, mt: 1 }}>
                  {previewText}
                </Typography>
              </Box>
            </Stack>
          </Collapse>

          <Button
            onClick={onSave}
            disabled={saving}
            startIcon={<SaveOutlinedIcon />}
            variant="contained"
            sx={{ ...responsiveButtonTextSx, bgcolor: '#111111', borderRadius: '14px', fontWeight: 900, maxWidth: '100%', overflow: 'hidden', py: 1.25, textTransform: 'none', '&:hover': { bgcolor: ACCENT } }}
          >
            {saving ? 'Saving...' : 'Save reminder'}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default function Profile({ user }) {
  const [profileForm, setProfileForm] = useState({ name: getDisplayName(user), email: user?.email || '' });
  const [preferences, setPreferences] = useState({
    currency: user?.user_metadata?.currency || '₹',
    theme: user?.user_metadata?.theme || 'light',
    numberFormat: user?.user_metadata?.number_format || 'indian'
  });
  const [reminderSettings, setReminderSettings] = useState({
    enabled: Boolean(user?.user_metadata?.expense_reminder?.enabled),
    frequency: user?.user_metadata?.expense_reminder?.frequency || 'daily',
    intervalDays: user?.user_metadata?.expense_reminder?.intervalDays || 2,
    customDays: user?.user_metadata?.expense_reminder?.customDays || ['mon', 'wed'],
    time: parseReminderTime(user?.user_metadata?.expense_reminder?.time || '20:00')
  });
  const [insights, setInsights] = useState({ totalExpense: 0, topCategory: 'No spending yet', averageDailySpend: 0 });
  const [syncStatus, setSyncStatus] = useState('Synced');
  const [savingKey, setSavingKey] = useState('');
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [notice, setNotice] = useState({ open: false, severity: 'success', message: '' });

  const formatMoney = useMemo(
    () => makeFormatter(preferences.numberFormat, preferences.currency),
    [preferences.currency, preferences.numberFormat]
  );

  const provider = user?.app_metadata?.provider || user?.identities?.[0]?.provider || 'email';
  const verified = Boolean(user?.email_confirmed_at || user?.confirmed_at);
  const enrollmentDate = user?.created_at
    ? format(new Date(user.created_at), 'dd MMM yyyy')
    : 'Not available';

  const showNotice = (message, severity = 'success') => {
    setNotice({ open: true, severity, message });
  };

  const fetchInsights = useCallback(async () => {
    if (!user?.id) return;

    setSyncStatus('Syncing');
    const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('transactions')
      .select('debit, date, categories(name)')
      .eq('user_id', user.id)
      .gte('date', monthStart)
      .lte('date', monthEnd);

    if (error) {
      setSyncStatus('Needs attention');
      return;
    }

    const records = data || [];
    const totalExpense = records.reduce((sum, item) => sum + Number(item.debit || 0), 0);
    const categoryTotals = records.reduce((acc, item) => {
      if (Number(item.debit || 0) <= 0) return acc;
      const name = item.categories?.name || 'Other';
      acc[name] = (acc[name] || 0) + Number(item.debit || 0);
      return acc;
    }, {});
    const topCategory = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a)[0]?.[0] || 'No spending yet';
    const daysElapsed = new Date().getDate();

    setInsights({
      totalExpense,
      topCategory,
      averageDailySpend: daysElapsed > 0 ? totalExpense / daysElapsed : 0
    });
    setSyncStatus('Synced');
  }, [user?.id]);

  useEffect(() => {
    setProfileForm({ name: getDisplayName(user), email: user?.email || '' });
    setPreferences({
      currency: user?.user_metadata?.currency || '₹',
      theme: user?.user_metadata?.theme || 'light',
      numberFormat: user?.user_metadata?.number_format || 'indian'
    });
    setReminderSettings({
      enabled: Boolean(user?.user_metadata?.expense_reminder?.enabled),
      frequency: user?.user_metadata?.expense_reminder?.frequency || 'daily',
      intervalDays: user?.user_metadata?.expense_reminder?.intervalDays || 2,
      customDays: user?.user_metadata?.expense_reminder?.customDays || ['mon', 'wed'],
      time: parseReminderTime(user?.user_metadata?.expense_reminder?.time || '20:00')
    });
  }, [user]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const handleLogout = () => supabase.auth.signOut();

  const handleSaveProfile = async () => {
    setSavingKey('profile');
    const payload = {
      data: {
        full_name: profileForm.name.trim()
      }
    };

    if (profileForm.email.trim() && profileForm.email.trim() !== user?.email) {
      payload.email = profileForm.email.trim();
    }

    const { error } = await supabase.auth.updateUser(payload);
    setSavingKey('');

    if (error) {
      showNotice(error.message, 'error');
      return;
    }

    showNotice(payload.email ? 'Profile saved. Confirm the new email from your inbox.' : 'Profile saved.');
  };

  const handleSaveSettings = async () => {
    setSavingKey('settings');
    const { error } = await supabase.auth.updateUser({
      data: {
        currency: preferences.currency,
        theme: preferences.theme,
        number_format: preferences.numberFormat
      }
    });
    setSavingKey('');

    if (error) {
      showNotice(error.message, 'error');
      return;
    }

    showNotice('Preferences updated.');
  };

  const handleSaveReminder = () => {
    const payload = {
      enabled: reminderSettings.enabled,
      frequency: reminderSettings.frequency,
      intervalDays: Number(reminderSettings.intervalDays || 1),
      customDays: reminderSettings.customDays,
      time: serializeReminderTime(reminderSettings.time)
    };

    setSavingKey('reminder');
    window.setTimeout(() => {
      setSavingKey('');
      showNotice(`Reminder preferences saved locally. Backend payload is ready: ${JSON.stringify(payload)}`);
    }, 350);
  };

  const handleExportCsv = async () => {
    if (!user?.id) return;

    setSavingKey('export');
    const { data, error } = await supabase
      .from('transactions')
      .select('date, description, debit, credit, categories(name), subcategories(name)')
      .eq('user_id', user.id)
      .order('date', { ascending: true });
    setSavingKey('');

    if (error) {
      showNotice(error.message, 'error');
      return;
    }

    const rows = [
      ['Date', 'Description', 'Category', 'Subcategory', 'Debit', 'Credit'],
      ...(data || []).map((item) => [
        item.date,
        item.description || '',
        item.categories?.name || '',
        item.subcategories?.name || '',
        item.debit || 0,
        item.credit || 0
      ])
    ];
    const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expense-data-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showNotice('CSV export ready.');
  };

  const handleResetData = async () => {
    if (!user?.id) return;

    setSavingKey('reset');
    const tables = ['transactions', 'lent', 'safe_keeping', 'savings'];
    const results = await Promise.all(tables.map((table) => supabase.from(table).delete().eq('user_id', user.id)));
    setSavingKey('');
    setResetOpen(false);

    const failed = results.find((result) => result.error);
    if (failed) {
      showNotice(failed.error.message, 'error');
      return;
    }

    fetchInsights();
    showNotice('Your app data has been reset.');
  };

  const handleDeleteAccount = async () => {
    setSavingKey('delete');
    const { error } = await supabase.functions.invoke('delete-account');
    setSavingKey('');
    setDeleteOpen(false);

    if (error) {
      showNotice('Account deletion needs a configured Supabase delete-account function.', 'error');
      return;
    }

    await supabase.auth.signOut();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
      <Container maxWidth="lg" sx={{ maxWidth: '100%', overflow: 'hidden', pb: 12, px: { xs: 1, sm: 3 }, fontFamily: 'Inter, sans-serif' }}>
        <Stack spacing={3}>
          <Box>
            <Typography sx={sectionLabelSx}>Account settings</Typography>
            <Typography component="h1" sx={{ mt: 1, color: '#000000', fontSize: { xs: 32, md: 42 }, fontWeight: 900, letterSpacing: '-0.04em' }}>
              Profile
            </Typography>
            <Typography sx={{ mt: 1, color: MUTED, fontSize: 14, fontWeight: 700 }}>
              Manage identity, preferences, and data controls.
            </Typography>
          </Box>

          <Card sx={{ ...cardSx, overflow: 'hidden' }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'flex-start' }}>
                <Stack direction="row" spacing={{ xs: 1.5, sm: 2.5 }} alignItems="center" sx={{ minWidth: 0 }}>
                  <Box sx={{ alignItems: 'center', backgroundColor: '#111111', borderRadius: '22px', color: '#FFFFFF', display: 'grid', flexShrink: 0, height: { xs: 60, sm: 72 }, justifyContent: 'center', width: { xs: 60, sm: 72 } }}>
                    <AccountCircleOutlinedIcon sx={{ fontSize: 38 }} />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Typography sx={{ ...truncateTextSx, color: '#000000', fontSize: { xs: 24, md: 32 }, fontWeight: 900, letterSpacing: '-0.04em' }}>
                        {profileForm.name || 'New user'}
                      </Typography>
                      <Chip
                        icon={verified ? <VerifiedUserOutlinedIcon /> : <ShieldOutlinedIcon />}
                        label={verified ? 'Verified' : 'Pending'}
                        size="small"
                        sx={{
                          bgcolor: verified ? '#ECFDF5' : '#FFF7ED',
                          color: verified ? '#059669' : '#EA580C',
                          fontSize: 10,
                          fontWeight: 900,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase'
                        }}
                      />
                    </Stack>
                    <Typography sx={{ mt: 0.75, color: MUTED, fontSize: 13, fontWeight: 700, wordBreak: 'break-word' }}>
                      {user?.email}
                    </Typography>
                  </Box>
                </Stack>

                <Button
                  onClick={handleLogout}
                  startIcon={<LogoutOutlinedIcon />}
                  variant="outlined"
                  sx={{
                    borderColor: BORDER,
                    borderRadius: '14px',
                    color: '#111111',
                    fontSize: 12,
                    fontWeight: 900,
                    maxWidth: '100%',
                    overflow: 'hidden',
                    px: 2.5,
                    py: 1.35,
                    textTransform: 'none',
                    ...responsiveButtonTextSx,
                    '&:hover': { borderColor: '#111111', backgroundColor: '#FAFAFA' }
                  }}
                >
                  Logout
                </Button>
              </Stack>

              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, mt: 4 }}>
                <TextField
                  label="User name"
                  value={profileForm.name}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, name: event.target.value }))}
                  InputProps={{ startAdornment: <InputAdornment position="start"><AccountCircleOutlinedIcon fontSize="small" /></InputAdornment> }}
                  sx={fieldSx}
                />
                <TextField
                  label="Email"
                  type="email"
                  value={profileForm.email}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, email: event.target.value }))}
                  InputProps={{ startAdornment: <InputAdornment position="start"><EmailOutlinedIcon fontSize="small" /></InputAdornment> }}
                  sx={fieldSx}
                />
                <InfoRow label="Enrollment date" value={enrollmentDate} />
                <InfoRow label="Verification status" value={verified ? 'Verified account' : 'Email verification pending'} />
              </Box>

                <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3, minWidth: 0 }}>
                <Button
                  onClick={handleSaveProfile}
                  disabled={savingKey === 'profile'}
                  startIcon={<SaveOutlinedIcon />}
                  variant="contained"
                  sx={{ ...responsiveButtonTextSx, bgcolor: '#111111', borderRadius: '14px', fontWeight: 900, maxWidth: '100%', overflow: 'hidden', px: 2.5, py: 1.25, textTransform: 'none', '&:hover': { bgcolor: ACCENT } }}
                >
                  {savingKey === 'profile' ? 'Saving...' : 'Save profile'}
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' } }}>
            <Card sx={cardSx}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 3, minWidth: 0 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={sectionLabelSx}>Quick insights</Typography>
                    <Typography sx={sectionTitleSx}>This month</Typography>
                  </Box>
                  <Box sx={{ ...iconBoxSx, flexShrink: 0 }}><SpeedOutlinedIcon /></Box>
                </Stack>
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, minWidth: 0 }}>
                  <StatTile icon={<AccountBalanceWalletOutlinedIcon fontSize="small" />} label="Total expenses" value={formatMoney(insights.totalExpense)} />
                  <StatTile icon={<CategoryOutlinedIcon fontSize="small" />} label="Top category" value={insights.topCategory} />
                  <StatTile icon={<SpeedOutlinedIcon fontSize="small" />} label="Daily average" value={formatMoney(insights.averageDailySpend)} />
                </Box>
              </CardContent>
            </Card>

            <Card sx={cardSx}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 3, minWidth: 0 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={sectionLabelSx}>Preferences</Typography>
                    <Typography sx={sectionTitleSx}>Display controls</Typography>
                  </Box>
                  <Box sx={{ ...iconBoxSx, flexShrink: 0 }}><CurrencyRupeeOutlinedIcon /></Box>
                </Stack>
                <Stack spacing={2}>
                  <SettingRow
                    icon={<CurrencyRupeeOutlinedIcon fontSize="small" />}
                    title="Currency"
                    subtitle="Default account symbol"
                    control={
                      <FormControl size="small" sx={{ maxWidth: '100%', minWidth: { xs: 76, sm: 112 }, width: { xs: 76, sm: 112 } }}>
                        <Select
                          value={preferences.currency}
                          onChange={(event) => setPreferences((prev) => ({ ...prev, currency: event.target.value }))}
                          sx={{
                            borderRadius: '12px',
                            fontWeight: 900,
                            '& .MuiSelect-select': {
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }
                          }}
                        >
                          <MenuItem value="₹">₹</MenuItem>
                          <MenuItem value="Rs.">Rs.</MenuItem>
                          <MenuItem value="$">$</MenuItem>
                        </Select>
                      </FormControl>
                    }
                  />
                  <SettingRow
                    icon={<DarkModeOutlinedIcon fontSize="small" />}
                    title="Theme"
                    subtitle={preferences.theme === 'dark' ? 'Dark mode selected' : 'Light mode selected'}
                    control={
                      <Switch
                        checked={preferences.theme === 'dark'}
                        onChange={(event) => setPreferences((prev) => ({ ...prev, theme: event.target.checked ? 'dark' : 'light' }))}
                      />
                    }
                  />
                  <SettingRow
                    icon={<PublicOutlinedIcon fontSize="small" />}
                    title="Number format"
                    subtitle={preferences.numberFormat === 'indian' ? 'Indian grouping' : 'International grouping'}
                    control={
                      <Switch
                        checked={preferences.numberFormat === 'international'}
                        onChange={(event) => setPreferences((prev) => ({ ...prev, numberFormat: event.target.checked ? 'international' : 'indian' }))}
                      />
                    }
                  />
                  <Button
                    onClick={handleSaveSettings}
                    disabled={savingKey === 'settings'}
                    startIcon={<SaveOutlinedIcon />}
                    variant="contained"
                    sx={{ ...responsiveButtonTextSx, bgcolor: '#111111', borderRadius: '14px', fontWeight: 900, maxWidth: '100%', overflow: 'hidden', py: 1.25, textTransform: 'none', '&:hover': { bgcolor: ACCENT } }}
                  >
                    {savingKey === 'settings' ? 'Saving...' : 'Save preferences'}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' } }}>
            <ExpenseReminderCard
              reminderSettings={reminderSettings}
              setReminderSettings={setReminderSettings}
              onSave={handleSaveReminder}
              saving={savingKey === 'reminder'}
            />

            <Card sx={cardSx}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 3, minWidth: 0 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={sectionLabelSx}>Data and privacy</Typography>
                    <Typography sx={sectionTitleSx}>Ownership tools</Typography>
                  </Box>
                  <Box sx={iconBoxSx}><StorageOutlinedIcon /></Box>
                </Stack>
                <Stack spacing={2}>
                  <Button
                    onClick={handleExportCsv}
                    disabled={savingKey === 'export'}
                    startIcon={<DownloadOutlinedIcon />}
                    variant="outlined"
                    sx={{ ...responsiveButtonTextSx, borderColor: BORDER, borderRadius: '14px', color: '#111111', fontWeight: 900, justifyContent: 'flex-start', maxWidth: '100%', overflow: 'hidden', py: 1.4, textTransform: 'none' }}
                  >
                    Export data as CSV
                  </Button>
                  <Button
                    onClick={() => setResetOpen(true)}
                    startIcon={<RestartAltOutlinedIcon />}
                    variant="outlined"
                    sx={{ ...responsiveButtonTextSx, borderColor: '#FECACA', borderRadius: '14px', color: '#DC2626', fontWeight: 900, justifyContent: 'flex-start', maxWidth: '100%', overflow: 'hidden', py: 1.4, textTransform: 'none' }}
                  >
                    Reset all data
                  </Button>
                  <Button
                    disabled
                    startIcon={<BackupOutlinedIcon />}
                    variant="outlined"
                    sx={{ ...responsiveButtonTextSx, borderColor: BORDER, borderRadius: '14px', fontWeight: 900, justifyContent: 'flex-start', maxWidth: '100%', overflow: 'hidden', py: 1.4, textTransform: 'none' }}
                  >
                    Backup and Restore - coming soon
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' } }}>
            <Card sx={{ ...cardSx, bgcolor: '#111111', color: '#FFFFFF' }}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 3, minWidth: 0 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ ...sectionLabelSx, color: '#A1A1AA' }}>System info</Typography>
                    <Typography sx={{ ...sectionTitleSx, color: '#FFFFFF' }}>Runtime details</Typography>
                  </Box>
                  <Box sx={{ ...iconBoxSx, bgcolor: 'rgba(255,255,255,0.08)' }}><CloudSyncOutlinedIcon /></Box>
                </Stack>
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, minWidth: 0 }}>
                  <Box><InfoRow dark label="User ID" value={user?.id} /></Box>
                  <Box><InfoRow dark label="Auth provider" value={provider} /></Box>
                  <Box><InfoRow dark label="App version" value={APP_VERSION} /></Box>
                  <Box><InfoRow dark label="Sync status" value={syncStatus} /></Box>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ ...cardSx, borderColor: '#FECACA' }}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 2, minWidth: 0 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ ...sectionLabelSx, color: '#DC2626' }}>Danger zone</Typography>
                    <Typography sx={sectionTitleSx}>Delete account</Typography>
                  </Box>
                  <Box sx={{ ...iconBoxSx, bgcolor: '#FEF2F2', color: '#DC2626' }}><DeleteForeverOutlinedIcon /></Box>
                </Stack>
                <Typography sx={{ color: MUTED, fontSize: 13, fontWeight: 700, lineHeight: 1.7, mb: 3 }}>
                  Permanently remove the account through a confirmed server-side deletion flow. This action should only be used when you are done with the workspace.
                </Typography>
                <Button
                  onClick={() => setDeleteOpen(true)}
                  startIcon={<DeleteForeverOutlinedIcon />}
                  variant="contained"
                  sx={{ ...responsiveButtonTextSx, bgcolor: '#DC2626', borderRadius: '14px', fontWeight: 900, maxWidth: '100%', overflow: 'hidden', py: 1.35, textTransform: 'none', '&:hover': { bgcolor: '#B91C1C' } }}
                >
                  Delete account
                </Button>
              </CardContent>
            </Card>
          </Box>
        </Stack>
      </Container>

      <Dialog open={resetOpen} onClose={() => setResetOpen(false)} PaperProps={{ sx: { borderRadius: '22px' } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>Reset all data?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: MUTED, fontSize: 14, fontWeight: 700 }}>
            This deletes your transactions and tracker records. Your login account remains active.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setResetOpen(false)} sx={{ color: '#111111', fontWeight: 900, textTransform: 'none' }}>Cancel</Button>
          <Button onClick={handleResetData} disabled={savingKey === 'reset'} variant="contained" color="error" sx={{ borderRadius: '12px', fontWeight: 900, textTransform: 'none' }}>
            {savingKey === 'reset' ? 'Resetting...' : 'Reset data'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} PaperProps={{ sx: { borderRadius: '22px' } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>Delete account?</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2, borderRadius: '14px' }}>
            This requires a configured Supabase server function named delete-account.
          </Alert>
          <Typography sx={{ color: MUTED, fontSize: 14, fontWeight: 700 }}>
            Confirming will call the secure deletion endpoint. If the endpoint is not installed, no account data will be deleted.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDeleteOpen(false)} sx={{ color: '#111111', fontWeight: 900, textTransform: 'none' }}>Cancel</Button>
          <Button onClick={handleDeleteAccount} disabled={savingKey === 'delete'} variant="contained" color="error" sx={{ borderRadius: '12px', fontWeight: 900, textTransform: 'none' }}>
            {savingKey === 'delete' ? 'Deleting...' : 'Confirm delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notice.open}
        autoHideDuration={3200}
        onClose={() => setNotice((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={notice.severity} sx={{ borderRadius: '14px', fontWeight: 800 }}>
          {notice.message}
        </Alert>
      </Snackbar>
    </motion.div>
  );
}
