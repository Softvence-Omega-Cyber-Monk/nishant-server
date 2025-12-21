import { Controller, Get, Param, Query } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) { }
  @Get("admin-overview")
  async adminAnalytics() {
    try {
      const result = await this.adminService.adminAnalatycs();

      return {
        success: true,
        message: "Admin Analytacis retrived successfully",
        data: result
      }
    } catch (error) {
      throw error;
    }
  };


  @Get("all-vendor")
  async getAllVendor(
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    try {
      const result = await this.adminService.getAllVendor(Number(page) || 1, Number(limit) || 10);

      return {
        success: true,
        message: "All vendor retrived successfully",
        data: result
      }
    } catch (error) {
      throw error
    }
  };


  @Get("get-all-campaign-by-admin")
  async getAllCampaign(
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {

    try {
      const result = await this.adminService.getAllCampain(Number(page) || 1, Number(limit) || 20);

      return {
        success: true,
        message: "All Campaign retrived successfylly",
        data: result
      }
    } catch (error) {
      throw error
    }

  };


  @Get("get-single-user-profile/:userId")
  async getSingleUserProfile(@Param("userId") userId: string) {
    try {
      const result = await this.adminService.getUserProfile(userId);
      return {
        success: true,
        message: "User Profile Retrived successfully",
        data: result
      }

    } catch (error) {
      throw error
    }

  };




}
