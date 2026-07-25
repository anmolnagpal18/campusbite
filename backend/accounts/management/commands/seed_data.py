from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
from college.models import College
from accounts.models import (
    Role, CollegeAdminProfile, VendorProfile, StaffProfile, UserProfile, Restaurant
)
from core.enums import ApprovalStatus, ShopStatus

User = get_user_model()

class Command(BaseCommand):
    help = "Seed initial database with all roles and standard Colleges"

    def handle(self, *args, **options):
        with transaction.atomic():
            # 1. Create Super Admin
            super_email = "superadmin@campusfood.com"
            super_pass = "Admin@123"
            
            user, created = User.objects.get_or_create(
                email=super_email,
                defaults={
                    'role': Role.SUPER_ADMIN,
                    'is_staff': True,
                    'is_superuser': True
                }
            )
            if created or not user.check_password(super_pass):
                user.set_password(super_pass)
                user.save()
                self.stdout.write(self.style.SUCCESS(f"Super Admin user '{super_email}' created/updated."))

            # 2. Seed Colleges
            colleges_data = [
                {"name": "Campus Institute of Technology", "city": "Austin", "status": "APPROVED"},
                {"name": "University of Campus Food", "city": "Boston", "status": "APPROVED"},
                {"name": "State College of Culinary", "city": "Chicago", "status": "APPROVED"}
            ]
            
            colleges = {}
            for col_data in colleges_data:
                college, col_created = College.objects.get_or_create(
                    name=col_data["name"],
                    defaults={"city": col_data["city"], "status": col_data["status"]}
                )
                colleges[college.name] = college
                if col_created:
                    self.stdout.write(self.style.SUCCESS(f"College '{college.name}' created."))

            # 3. Create College Admin
            ca_email = "collegeadmin@campusfood.com"
            ca_pass = "Admin@123"
            ca_user, ca_created = User.objects.get_or_create(
                email=ca_email,
                defaults={'role': Role.COLLEGE_ADMIN}
            )
            if ca_created or not ca_user.check_password(ca_pass):
                ca_user.set_password(ca_pass)
                ca_user.save()
                
            CollegeAdminProfile.objects.get_or_create(
                user=ca_user,
                defaults={
                    'college': colleges["Campus Institute of Technology"],
                    'status': ApprovalStatus.APPROVED
                }
            )
            self.stdout.write(self.style.SUCCESS(f"College Admin user '{ca_email}' created/updated."))

            # 4. Create Vendor
            v_email = "vendor@campusfood.com"
            v_pass = "Admin@123"
            v_user, v_created = User.objects.get_or_create(
                email=v_email,
                defaults={'role': Role.VENDOR}
            )
            if v_created or not v_user.check_password(v_pass):
                v_user.set_password(v_pass)
                v_user.save()
                
            vendor_profile, vp_created = VendorProfile.objects.get_or_create(
                user=v_user,
                defaults={
                    'college': colleges["Campus Institute of Technology"],
                    'status': ApprovalStatus.APPROVED
                }
            )
            
            # Create Restaurant for Vendor
            Restaurant.objects.get_or_create(
                vendor=vendor_profile,
                defaults={
                    'restaurant_name': "Campus Bite Express",
                    'shop_area': "Food Court A",
                    'block': "Block C",
                    'status': ShopStatus.OPEN,
                    'accepting_orders': True
                }
            )
            self.stdout.write(self.style.SUCCESS(f"Vendor user '{v_email}' and restaurant created/updated."))

            # 5. Create Staff
            s_email = "staff@campusfood.com"
            s_pass = "Admin@123"
            s_user, s_created = User.objects.get_or_create(
                email=s_email,
                defaults={'role': Role.STAFF}
            )
            if s_created or not s_user.check_password(s_pass):
                s_user.set_password(s_pass)
                s_user.save()
                
            StaffProfile.objects.get_or_create(
                user=s_user,
                defaults={
                    'vendor': vendor_profile,
                    'status': ApprovalStatus.APPROVED
                }
            )
            self.stdout.write(self.style.SUCCESS(f"Staff user '{s_email}' created/updated."))

            # 6. Create User (Customer)
            u_email = "user@campusfood.com"
            u_pass = "Admin@123"
            u_user, u_created = User.objects.get_or_create(
                email=u_email,
                defaults={'role': Role.USER}
            )
            if u_created or not u_user.check_password(u_pass):
                u_user.set_password(u_pass)
                u_user.save()
                
            UserProfile.objects.get_or_create(user=u_user)
            self.stdout.write(self.style.SUCCESS(f"Customer user '{u_email}' created/updated."))
