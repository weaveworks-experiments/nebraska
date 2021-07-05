import {
  Box,
  Divider,
  FormLabel,
  makeStyles,
  Switch,
  Tooltip,
  Typography,
  useTheme,
} from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormHelperText from '@material-ui/core/FormHelperText';
import Grid from '@material-ui/core/Grid';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import { Field, Form, Formik } from 'formik';
import { Select, TextField } from 'formik-material-ui';
import React from 'react';
import { useTranslation } from 'react-i18next';
import * as Yup from 'yup';
import { Channel, Group } from '../../api/apiDataTypes';
import { applicationsStore } from '../../stores/Stores';
import { ARCHES } from '../../utils/helpers';
import TimezonePicker, { DEFAULT_TIMEZONE } from '../Common/TimezonePicker';

const useStyles = makeStyles({
  root: {
    padding: '0.5em 0em',
    overflow: 'hidden',
  },
  indicator: {
    background: '#000',
  },
});

function EditDialog(props: {
  create?: boolean;
  data: {
    [key: string]: any;
  };
  onHide: () => void;
  show: boolean;
}) {
  const isCreation = Boolean(props.create);
  const classes = useStyles();
  const [groupEditActiveTab, setGroupEditActiveTab] = React.useState(0);
  const { t } = useTranslation();
  const theme = useTheme();

  function handleSubmit(values: { [key: string]: any }, actions: { [key: string]: any }) {
    const updatesPeriodPolicy =
      values.updatesPeriodRange.toString() + ' ' + values.updatesPeriodUnit;
    const updatesTimeoutPolicy = values.updatesTimeout.toString() + ' ' + values.updatesTimeoutUnit;

    const data: {
      [key: string]: any;
    } = {
      name: values.name,
      track: values.track,
      description: values.description,
      policy_updates_enabled: values.updatesEnabled,
      policy_safe_mode: values.safeMode,
      policy_office_hours: values.onlyOfficeHours,
      policy_max_updates_per_period: values.maxUpdates,
      policy_period_interval: updatesPeriodPolicy,
      policy_update_timeout: updatesTimeoutPolicy,
    };

    if (values.channel) data['channel_id'] = values.channel;

    if (values.timezone) data['policy_timezone'] = values.timezone;

    let packageFunctionCall;
    if (isCreation) {
      data['application_id'] = props.data.appID;
      packageFunctionCall = applicationsStore.createGroup(data as Group);
    } else {
      data['id'] = props.data.group.id;
      packageFunctionCall = applicationsStore.updateGroup(data as Group);
    }

    packageFunctionCall
      .then(() => {
        props.onHide();
        actions.setSubmitting(false);
      })
      .catch(() => {
        actions.setSubmitting(false);
        actions.setStatus({
          statusMessage: t('groups|Something went wrong. Check the form or try again later...'),
        });
      });
  }

  function TabPanel(props: {
    render: () => React.ReactElement | null;
    index: number;
    value: number;
  }) {
    const { index, value, render } = props;

    return index === value ? render() : null;
  }

  function handleClose() {
    props.onHide();
  }

  function onEditGroupTabChange(event: any, index: any) {
    setGroupEditActiveTab(index);
  }

  //@ts-ignore
  function renderForm({ values, status, setFieldValue, isSubmitting }) {
    const channels = props.data.channels ? props.data.channels : [];

    return (
      <Form data-testid="group-edit-form">
        <DialogContent className={classes.root}>
          {status && status.statusMessage && (
            <DialogContentText color="error">{status.statusMessage}</DialogContentText>
          )}
          <Box py={1}>
            <Tabs
              value={groupEditActiveTab}
              onChange={onEditGroupTabChange}
              classes={{ indicator: classes.indicator }}
            >
              <Tab label="Details" />
              <Tab label="Policy" />
            </Tabs>
            <Divider />
          </Box>
          <TabPanel
            index={0}
            value={groupEditActiveTab}
            render={() => <GroupDetailsForm channels={channels} />}
          />
          <TabPanel
            index={1}
            value={groupEditActiveTab}
            render={() => <GroupPolicyForm values={values} setFieldValue={setFieldValue} />}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>
            <Box color={theme.palette.greyShadeColor} component="span">
              {t('frequent|Cancel')}
            </Box>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Box component="span" color="#ffff" bgcolor="#000" width="100%" px={1.5} py={1}>
              {isCreation ? t('frequent|Add') : t('frequent|Save')}
            </Box>
          </Button>
        </DialogActions>
      </Form>
    );
  }

  function positiveNum() {
    return Yup.number()
      .positive()
      .min(1, t('groups|Must be greather than or equal to 1'))
      .required('Required');
  }

  function maxCharacters(maxChars: number, required = false) {
    let validation = Yup.string().max(maxChars, t('groups|Must be less than $maxChars characters'));

    if (required) validation = validation.required('Required');

    return validation;
  }

  const validation = Yup.object().shape({
    name: maxCharacters(50, true),
    track: maxCharacters(256),
    description: maxCharacters(250),
    maxUpdates: positiveNum(),
    updatesPeriodRange: positiveNum(),
    updatesTimeout: positiveNum(),
  });

  let initialValues = {};

  if (isCreation) {
    initialValues = {
      maxUpdates: 1,
      updatesPeriodRange: 1,
      updatesPeriodUnit: 'hours',
      updatesTimeout: 1,
      updatesTimeoutUnit: 'days',
      channel: '',
      timezone: DEFAULT_TIMEZONE,
    };
  } else if (!!props.data.group) {
    const group = props.data.group;
    const [currentUpdatesPeriodRange, currentUpdatesPeriodUnit] =
      group.policy_period_interval.split(' ');
    const [currentupdatesTimeout, currentUpdatesTimeoutUnit] =
      group.policy_update_timeout.split(' ');

    initialValues = {
      name: group.name,
      track: group.track,
      description: group.description,
      timezone: group.policy_timezone || DEFAULT_TIMEZONE,
      updatesEnabled: group.policy_updates_enabled,
      onlyOfficeHours: group.policy_office_hours,
      safeMode: group.policy_safe_mode,
      maxUpdates: group.policy_max_updates_per_period,
      channel: group.channel ? group.channel.id : '',
      updatesPeriodRange: currentUpdatesPeriodRange,
      updatesPeriodUnit: currentUpdatesPeriodUnit,
      updatesTimeout: currentupdatesTimeout,
      updatesTimeoutUnit: currentUpdatesTimeoutUnit,
    };
  }

  return (
    <Dialog open={props.show} onClose={handleClose} aria-labelledby="form-dialog-title">
      <DialogTitle>{isCreation ? t('groups|Add Group') : t('groups|Edit Group')}</DialogTitle>
      <Formik
        initialValues={initialValues}
        onSubmit={handleSubmit}
        validationSchema={validation}
        //@todo add better types
        //@ts-ignore
        render={renderForm}
      />
    </Dialog>
  );
}

function GroupDetailsForm(props: { channels: Channel[] }) {
  const { t } = useTranslation();
  const { channels } = props;
  return (
    <div style={{ padding: '1rem' }}>
      <Grid container spacing={2} justify="center">
        <Grid item xs={8}>
          <Field name="name" component={TextField} margin="dense" label="Name" required fullWidth />
        </Grid>
        <Grid item xs={4}>
          <FormControl margin="dense" fullWidth>
            <InputLabel shrink>Channel</InputLabel>
            <Field name="channel" component={Select} displayEmpty>
              <MenuItem value="" key="">
                {t('groups|None yet')}
              </MenuItem>
              {channels.map((channelItem: Channel) => (
                <MenuItem value={channelItem.id} key={channelItem.id}>
                  {`${channelItem.name}(${ARCHES[channelItem.arch]})`}
                </MenuItem>
              ))}
            </Field>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <Field
            name="description"
            component={TextField}
            margin="dense"
            label={t('groups|Description')}
            fullWidth
          />
        </Grid>
        <Grid item xs={12}>
          <Field
            name="track"
            component={TextField}
            margin="dense"
            label={t('groups|Track (identifier for clients, filled with the group ID if omitted)')}
            fullWidth
          />
        </Grid>
      </Grid>
    </div>
  );
}

function GroupPolicyForm(props: {
  values: { [key: string]: string };
  setFieldValue: (formField: string, value: any) => any;
}) {
  const { t } = useTranslation();
  const { values, setFieldValue } = props;

  return (
    <div style={{ padding: '1rem' }}>
      <Grid container justify="space-between" spacing={4}>
        <Grid item xs={12}>
          <Box mt={1}>
            <FormLabel component="legend">{t('groups|Update')}</FormLabel>
          </Box>
          <Grid container>
            <Grid item xs={6}>
              <FormControlLabel
                label={t('groups|Updates enabled')}
                control={
                  <Field
                    name="updatesEnabled"
                    component={Switch}
                    color="primary"
                    checked={values.updatesEnabled}
                    onChange={(e: any) => {
                      setFieldValue('updatesEnabled', e.target.checked);
                    }}
                  />
                }
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                label={t('groups|Safe mode')}
                control={
                  <Field
                    name="safeMode"
                    component={Switch}
                    checked={values.safeMode}
                    color="primary"
                    onChange={(e: any) => {
                      setFieldValue('safeMode', e.target.checked);
                    }}
                  />
                }
              />
              <FormHelperText>
                {t('groups|Only update 1 instance at a time, and stop if an update fails.')}
              </FormHelperText>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <Box mt={2}>
        <Divider />
      </Box>
      <Box mt={2}>
        <FormLabel component="legend">{t('groups|Update Limits')}</FormLabel>
      </Box>
      <Box>
        <Grid container>
          <Grid item xs={6}>
            <FormControlLabel
              label={
                <Box display="flex" alignItems="center">
                  <Box pr={0.5}>{t('groups|Only office hours')}</Box>
                  <Box pt={0.1} color="#808080">
                    <Tooltip title={t('groups|Only update from 9am to 5pm.') || ''}>
                      <HelpOutlineIcon fontSize="small" />
                    </Tooltip>
                  </Box>
                </Box>
              }
              control={
                <Box>
                  <Field
                    name="onlyOfficeHours"
                    component={Switch}
                    color="primary"
                    checked={values.onlyOfficeHours}
                    onChange={(e: any) => {
                      setFieldValue('onlyOfficeHours', e.target.checked);
                    }}
                  />
                </Box>
              }
            />
          </Grid>
          <Grid item xs={6}>
            <Field
              component={TimezonePicker}
              name="timezone"
              value={values.timezone}
              onSelect={(timezone: string) => {
                setFieldValue('timezone', timezone);
              }}
            />
          </Grid>
        </Grid>
      </Box>
      <Box my={2}>
        <Grid item xs={12} container spacing={2} justify="space-between" alignItems="center">
          <Grid item xs={5}>
            <Box pl={2}>
              <Field
                name="maxUpdates"
                component={TextField}
                label={t('groups|Max number of updates')}
                margin="dense"
                type="number"
                fullWidth
              />
            </Box>
          </Grid>
          <Grid item>
            <Typography color="textSecondary">{t('groups|per')}</Typography>
          </Grid>
          <Grid item xs={3}>
            <Box mt={2}>
              <Field
                name="updatesPeriodRange"
                component={TextField}
                margin="dense"
                type="number"
                fullWidth
              />
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box mt={2} mr={2}>
              <Field name="updatesPeriodUnit" component={TextField} margin="dense" select fullWidth>
                <MenuItem value={'hours'} key={'hours'}>
                  {t('groups|hours')}
                </MenuItem>
                <MenuItem value={'minutes'} key={'minutes'}>
                  {t('groups|minutes')}
                </MenuItem>
                <MenuItem value={'days'} key={'days'}>
                  {t('groups|days')}
                </MenuItem>
              </Field>
            </Box>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <Box mt={2} pl={2}>
            <FormLabel>{t('groups|Updates timeout')}</FormLabel>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Field name="updatesTimeout" component={TextField} margin="dense" type="number" />
              </Grid>
              <Grid item xs={3}>
                <Box pr={2}>
                  <Field
                    name="updatesTimeoutUnit"
                    component={TextField}
                    margin="dense"
                    select
                    fullWidth
                  >
                    <MenuItem value={'hours'} key={'hours'}>
                      {t('groups|hours')}
                    </MenuItem>
                    <MenuItem value={'minutes'} key={'minutes'}>
                      {t('groups|minutes')}
                    </MenuItem>
                    <MenuItem value={'days'} key={'days'}>
                      {t('groups|days')}
                    </MenuItem>
                  </Field>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Box>
    </div>
  );
}
export default EditDialog;
