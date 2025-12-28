import { handleFetch } from './http';
import { API_URL } from '../../constants/constants';
import { getAuthToken } from '../auth';

export const fetchPersons = async ({ signal }) => {
  const url = `${API_URL}/person/list`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, 'Cannot fetch persons');
}

export const fetchPersonByUuid = async ({ signal, uuid }) => {
  const url = `${API_URL}/person/${uuid}`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, 'Cannot fetch person');
}

export const fetchPersonsForLog = async ({ signal, logUuid }) => {
  const url = `${API_URL}/person/persons-for-log/${logUuid}`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, 'Cannot fetch persons for log');
}

export const fetchLogsForPerson = async ({ signal, personUuid }) => {
  const url = `${API_URL}/person/logs-for-person/${personUuid}`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, 'Cannot fetch logs for person');
}

export const createPerson = async ({ payload }) => {
  const url = `${API_URL}/person`;
  const options = {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
  return await handleFetch(url, options, 'Cannot create person');
}

export const updatePerson = async ({ payload }) => {
  const url = `${API_URL}/person`;
  const options = {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
  return await handleFetch(url, options, 'Cannot update person');
}

export const createPersonToLog = async ({ payload }) => {
  const url = `${API_URL}/person/person-to-log`;
  const options = {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
  return await handleFetch(url, options, 'Cannot create person-to-log record');
}

export const updatePersonToLog = async ({ payload }) => {
  const url = `${API_URL}/person/person-to-log`;
  const options = {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
  return await handleFetch(url, options, 'Cannot update person-to-log record');
}

export const deletePersonToLog = async ({ payload }) => {
  const url = `${API_URL}/person/person-to-log`;
  const options = {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
  return await handleFetch(url, options, 'Cannot delete person-to-log record');
}

export const deletePerson = async ({ uuid }) => {
  const url = `${API_URL}/person/${uuid}`;
  const options = {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
  };
  return await handleFetch(url, options, 'Cannot delete person');
}

export const fetchRoles = async ({ signal }) => {
  const url = `${API_URL}/person/roles`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, 'Cannot fetch roles');
}

