// remove imports from tsyringe
import 'reflect-metadata';
import { container } from 'tsyringe';
import { inject as inject2, injectable as injectable2 } from 'tsyringe';
import { isCpf } from 'iscpf';
const test = isCpf('75300153206');
