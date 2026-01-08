import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
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

  @Get("getAllUserByAdmin")
  async getAllUser(@Query("page") page: string, @Query("limit") limit: string) {
    try {
      const result = await this.adminService.getAllUser(Number(page) || 1, Number(limit));

      return {
        data: result
      }

    } catch (error) {
      throw error
    }
  }


  @Get("GetAllReportsByAdmin")
  async getAllReports(
    @Query("page") page: string,
    @Query("limit") limit: string
  ) {
    try {
      const result = await this.adminService.getAllReports(Number(page) || 1, Number(limit) || 20);
      return {
        succrss: true,
        message: "Get All Reports by admin",
        data: result
      }
    } catch (error) {
      throw error
    }
  }

  @Patch("update/report/:reportId")
  async updateRerport(@Param("reportId") reportId: string) {
    try {
      const result = await this.adminService.updateReport(reportId);

      return {
        success: true,
        message: "Report Status updated success",
        data: result
      }

    } catch (error) {
      throw error
    }
  };


  @Get("admin/reveniewOverview")
  async reveniewOverview() {
    try {
      const result = await this.adminService.reveniewOverview();

      return {
        success: true,
        message: "Reveniew Overview Retrived successfully",
        data: result
      }

    } catch (error) {
      throw error;
    }
  };





  @Get("admin/campaignAnalytics/:campaignId")
  async getCampaignAnalytics(
    @Param("campaignId") campaignId: string
  ) {
    const result = await this.adminService.getCampainAnalyticalData(campaignId);

    return {
      success: true,
      message: "Campaign Analytics retrived successfully",
      data: result
    }

  };


  @Patch("flagCampaign/:campainId")
  async updateCampaignFlag(
    @Param("campainId") campainId: string
  ) {

    const result = await this.adminService.updateCampaignStatus(campainId);

    return {
      success: true,
      message: "Successfully Flaged Campaign",
      data: result
    }

  };



  @Patch("/admin/banuser/:userId")
  async banUser(
    @Query("userId") userId: string
  ) {
    const result = await this.adminService.banUser(userId);

    return {
      success: true,
      message: "User Updated Successfully",
      data: result
    }

    try {

    } catch (error) {
      throw error
    }

  }

}
