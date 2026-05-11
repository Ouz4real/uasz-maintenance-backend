import {
  Component, Input, Output, EventEmitter,
  ElementRef, HostListener, forwardRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

export const EQUIPEMENTS_UNIVERSITE: string[] = [
  // Informatique & bureautique
  'Ordinateur de bureau', 'Ordinateur portable', 'Tablette numérique',
  'Écran / Moniteur', 'Clavier', 'Souris', 'Webcam', 'Microphone',
  'Imprimante', 'Imprimante laser','Imprimante jet d\'encre', 'Imprimante multifonction',
  'Scanner', 'Photocopieuse', 'Traceur / Plotter',
  // Réseau & serveurs
  'Serveur informatique', 'Routeur', 'Switch réseau', 'Point d\'accès Wi-Fi',
  'Câble réseau / Patch panel', 'Onduleur (UPS)', 'Baie de brassage',
  'Pare-feu (Firewall)', 'NAS (Stockage réseau)',
  // Audiovisuel & présentation
  'Vidéoprojecteur', 'Écran de projection', 'Tableau blanc interactif (TBI)',
  'Télévision / Écran mural', 'Système de sonorisation', 'Microphone sans fil',
  'Amplificateur audio', 'Caméra de surveillance', 'Caméra de visioconférence',
  'Système de visioconférence', 'Lecteur DVD / Blu-ray',
  // Électricité & énergie
  'Climatiseur split', 'Climatiseur central', 'Ventilateur',
  'Groupe électrogène', 'Tableau électrique', 'Disjoncteur',
  'Prise électrique / Multiprise', 'Éclairage (néon / LED)', 'Lampe',
  'Panneau solaire', 'Batterie solaire',
  // Plomberie & sanitaire
  'Robinet', 'Chauffe-eau', 'Pompe à eau', 'Château d\'eau',
  'Toilettes / WC', 'Lavabo', 'Douche', 'Tuyauterie',
  // Mobilier & équipements de salle
  'Bureau', 'Chaise', 'Table de réunion', 'Tableau noir / blanc',
  'Armoire / Placard', 'Étagère', 'Casier', 'Podium / Estrade',
  'Rideau / Store', 'Porte', 'Fenêtre / Vitre',
  // Laboratoire
  'Microscope', 'Balance de précision', 'Centrifugeuse', 'Spectrophotomètre',
  'Oscilloscope', 'Générateur de fonctions', 'Multimètre', 'Alimentation de labo',
  'Hotte aspirante', 'Étuve / Four de labo', 'Réfrigérateur de labo',
  'Agitateur magnétique', 'Distillateur d\'eau',
  // Bibliothèque & documentation
  'Scanner de bibliothèque', 'Lecteur de codes-barres', 'Antivol RFID',
  'Borne de prêt automatique',
  // Sécurité & accès
  'Caméra IP', 'Alarme incendie', 'Extincteur', 'Détecteur de fumée',
  'Contrôle d\'accès (badge)', 'Interphone', 'Portail automatique',
  // Divers
  'Photocopieur grand format', 'Machine à café', 'Réfrigérateur',
  'Micro-ondes', 'Distributeur automatique',
];

@Component({
  selector: 'app-equipement-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './equipement-autocomplete.component.html',
  styleUrls: ['./equipement-autocomplete.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EquipementAutocompleteComponent),
      multi: true
    }
  ]
})
export class EquipementAutocompleteComponent implements ControlValueAccessor {
  @Input() placeholder = 'Ex : Ordinateur de bureau, Vidéoprojecteur...';
  @Input() inputId = 'equipement';
  @Input() inputName = 'equipement';
  @Input() required = false;

  inputValue = '';
  suggestions: string[] = [];
  showDropdown = false;
  activeIndex = -1;

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private elRef: ElementRef) {}

  writeValue(val: string): void { this.inputValue = val ?? ''; }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }

  onInput(value: string): void {
    this.inputValue = value;
    this.onChange(value);
    this.activeIndex = -1;
    if (value.trim().length === 0) {
      this.suggestions = [];
      this.showDropdown = false;
      return;
    }
    const q = this.normalize(value);
    this.suggestions = EQUIPEMENTS_UNIVERSITE.filter(e => this.normalize(e).includes(q));
    this.showDropdown = this.suggestions.length > 0;
  }

  select(eq: string): void {
    this.inputValue = eq;
    this.onChange(eq);
    this.showDropdown = false;
    this.suggestions = [];
    this.activeIndex = -1;
  }

  onKeydown(event: KeyboardEvent): void {
    if (!this.showDropdown) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex = Math.min(this.activeIndex + 1, this.suggestions.length - 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex = Math.max(this.activeIndex - 1, 0);
    } else if (event.key === 'Enter' && this.activeIndex >= 0) {
      event.preventDefault();
      this.select(this.suggestions[this.activeIndex]);
    } else if (event.key === 'Escape') {
      this.showDropdown = false;
    }
  }

  onBlur(): void {
    this.onTouched();
    setTimeout(() => { this.showDropdown = false; }, 150);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
  }

  private normalize(s: string): string {
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
}
