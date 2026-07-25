from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from college.models import College
from accounts.models import Role

User = get_user_model()

class Command(BaseCommand):
    help = "Seed initial database with Super Admin and standard Colleges"

    def handle(self, *args, **options):
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
        else:
            self.stdout.write(self.style.SUCCESS(f"Super Admin user '{super_email}' already exists."))

        # 2. Seed Colleges
        colleges = [
            {"name": "Campus Institute of Technology", "city": "Austin", "status": "APPROVED"},
            {"name": "University of Campus Food", "city": "Boston", "status": "APPROVED"},
            {"name": "State College of Culinary", "city": "Chicago", "status": "APPROVED"}
        ]
        
        for col_data in colleges:
            college, col_created = College.objects.get_or_create(
                name=col_data["name"],
                defaults={"city": col_data["city"], "status": col_data["status"]}
            )
            if col_created:
                self.stdout.write(self.style.SUCCESS(f"College '{college.name}' created."))
            else:
                self.stdout.write(self.style.SUCCESS(f"College '{college.name}' already exists."))
