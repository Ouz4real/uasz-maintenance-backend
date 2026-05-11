import {
  Component, Input, Output, EventEmitter,
  OnInit, ElementRef, HostListener, forwardRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

export const LIEUX_UASZ: string[] = [
  // Amphithéâtres
  'Amphi 1', 'Amphi Complexe Amadou Tidiane Ba', 'Amphi Complexe Amadou Tidiane Ba salle A',
  'Amphi Complexe Amadou Tidiane Ba salle B', 'Amphi Complexe Amadou Tidiane Ba salle C',
  'Amphi UFR ST-500', 'Amphi UFR SES-500',
  // UFR / Bâtiments principaux
  'UFR des Sciences et Technologies (ST)', 'UFR des Lettres, Arts et Sciences Humaines (LASHU)',
  'UFR des Sciences Économiques et Sociales (SES)', 'UFR des Sciences de la Santé  (2S)',
  // Laboratoires
  'Labo Informatique 1', 'Labo Informatique 2', 'Labo Informatique 3',
  'Labo Scientifique', 'Labo Langues', 
  // Salles de cours
  'Salle E01', 'Salle E02', 'Salle E03', 'Salle E04', 
  'Salle F01', 'Salle F02', 'Salle F03', 'Salle F04',
  'Salle C01', 'Salle C02', 'Salle C03', 'Salle C04',
  'Salle D01', 'Salle D02', 'Salle D03', 'Salle D04',
  'Salle H200', 'Salle S200',
  // PGF
  'PGF-SUP Salle 01', 'PGF-SUP Salle 02', 'PGF-SUP Salle 03',
  'PGF-SUP Salle 04', 'PGF-SUP Salle 05', 'PGF-SUP Salle 06',
  'PGF-SUP Salle 07', 'PGF-SUP Salle 08', 'PGF-SUP Salle 09', 'PGF-SUP Salle 10',
  // Bureaux et services
   'Scolarité', 'Bibliothèque Centrale', 'Bibliothèque UFR 2S',
  'Salle des Professeurs', 'Salle de Réunion', 'Salle visioconférence',
  'Bâtiment E', 'Bâtiment F', 'Bâtiment D ', 'Bâtiment C ','Bâtiment ST', 
  'Bloc scientifique', 'Bâtiment ST', 'Bâtiment SES', 'Bâtiment LASHU', 
  // Infrastructures
  'Pavillon A', 'Pavillon B', 'Pavillon C', 'Pavillon D', 'Pavillon E', 'Pavillon F',
  'Restaurant Universitaire', 'Infirmerie',
 'Entrée Principale', 'Rectorat', 'Vice-rectorat','Orange Digital Center (ODC)','Campus Numérique'
];

@Component({
  selector: 'app-lieu-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lieu-autocomplete.component.html',
  styleUrls: ['./lieu-autocomplete.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LieuAutocompleteComponent),
      multi: true
    }
  ]
})
export class LieuAutocompleteComponent implements ControlValueAccessor {
  @Input() placeholder = 'Ex : Amphi A, Labo Informatique 1...';
  @Input() inputId = 'lieu';
  @Input() inputName = 'lieu';
  @Input() required = false;

  inputValue = '';
  suggestions: string[] = [];
  showDropdown = false;
  activeIndex = -1;

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private elRef: ElementRef) {}

  // ControlValueAccessor
  writeValue(val: string): void {
    this.inputValue = val ?? '';
  }
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
    this.suggestions = LIEUX_UASZ.filter(l => this.normalize(l).includes(q));
    this.showDropdown = this.suggestions.length > 0;
  }

  select(lieu: string): void {
    this.inputValue = lieu;
    this.onChange(lieu);
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
    // Délai pour permettre le clic sur une suggestion
    setTimeout(() => { this.showDropdown = false; }, 150);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
  }

  private normalize(s: string): string {
    return s.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}
