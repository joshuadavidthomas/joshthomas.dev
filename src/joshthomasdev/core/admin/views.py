from __future__ import annotations

from django import forms
from django.core.exceptions import ValidationError
from django.urls import reverse_lazy
from django.views.generic import FormView
from django.views.generic import TemplateView

from joshthomasdev.users.models import OTPData
from joshthomasdev.users.models import User


class AdminSetupTwoFactorAuthView(TemplateView):
    template_name = "admin/setup_2fa.html"

    def post(self, request):
        context = {}
        user = request.user

        try:
            two_factor_auth_data = user.create_otp_data()

            context["otp_secret"] = two_factor_auth_data.secret
            context["qr_code"] = two_factor_auth_data.generate_qrcode()
        except ValidationError as exc:
            context["form_errors"] = exc.messages

        return self.render_to_response(context)


class AdminConfirmTwoFactorAuthView(FormView):
    template_name = "admin/confirm_2fa.html"
    success_url = reverse_lazy("admin:index")

    class Form(forms.Form):
        user: User

        otp = forms.CharField(
            required=True,
            label="2FA Code",
            widget=forms.TextInput(attrs={"style": "width: 100%;"}),
        )

        def clean_otp(self):
            # assert self.user is not None

            self.two_factor_auth_data = OTPData.objects.for_user(self.user)

            if self.two_factor_auth_data is None:
                raise ValidationError("2FA not set up.")

            otp = self.cleaned_data.get("otp")

            if not self.two_factor_auth_data.validate_otp(otp):
                raise ValidationError("Invalid 2FA code.")

            return otp

    def get_form_class(self):
        return self.Form

    def get_form(self, *args, **kwargs):
        form = super().get_form(*args, **kwargs)

        form.user = self.request.user

        return form

    def form_valid(self, form):
        return super().form_valid(form)
