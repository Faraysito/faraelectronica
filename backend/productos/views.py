from rest_framework import generics
from rest_framework.decorators import api_view, throttle_classes
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from django.conf import settings
from .models import Producto
from .serializers import ProductoSerializer

class ProductoListView(generics.ListAPIView):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer

    def get_queryset(self):
        categoria = self.request.query_params.get('categoria')
        if categoria:
            return Producto.objects.filter(categoria__iexact=categoria)
        return Producto.objects.all()

class ProductoDetailView(generics.RetrieveAPIView):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer

@api_view(['POST'])
@throttle_classes([AnonRateThrottle])
def google_login(request):
    token = request.data.get('token')

    if not token:
        return Response({'error': 'Token requerido'}, status=400)

    try:
        decoded = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            settings.GOOGLE_OAUTH2_CLIENT_ID
        )

        email = decoded.get('email')
        name = decoded.get('name', email)
        picture = decoded.get('picture')

        if not email:
            return Response({'error': 'Token inválido'}, status=400)

        user, created = User.objects.get_or_create(
            email=email,
            defaults={'username': email, 'first_name': name}
        )

        refresh = RefreshToken.for_user(user)

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.first_name,
                'foto': picture,
                'created': created
            }
        })
    except ValueError:
        return Response({'error': 'Token de Google inválido'}, status=401)
    except Exception:
        return Response({'error': 'Error de autenticación'}, status=400)