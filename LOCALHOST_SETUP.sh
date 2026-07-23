#!/bin/bash
echo "🚀 Configurando FaraElectrónica para localhost..."

cd backend

echo "📦 Instalando dependencias..."
pip install -r requirements.txt

echo "🔄 Creando migraciones..."
python manage.py makemigrations

echo "📝 Aplicando migraciones..."
python manage.py migrate

echo "✅ Setup completado!"
echo ""
echo "Para iniciar el servidor, ejecuta:"
echo "   python manage.py runserver"
echo ""
echo "Luego accede a:"
echo "   Admin: http://127.0.0.1:8000/gestion-fara-super-user/"
echo "   API: http://127.0.0.1:8000/api/"
