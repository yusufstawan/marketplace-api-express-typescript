import { Request } from "express";

export interface IReqUser extends Request {
  user: {
    roles: string[];
    id: string;
  };
}

export interface IPaginationQuery {
  limit: number;
  page: number;
  search?: string;
}
